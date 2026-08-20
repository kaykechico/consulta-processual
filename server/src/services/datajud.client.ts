import axios, { type AxiosError, type AxiosResponse } from "axios";
import { ApiError } from "../utils/errors";
import { logger } from "../lib/logger";
import { DataJudResponseSchema, type DataJudProcessoRaw } from "./datajud.schemas";
import { API_ERROR_CODES } from "../../../shared/src/schemas.js";

export interface DataJudClientOptions {
  baseUrl: string;
  token: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
}

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const RETRYABLE_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

function isRetryable(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status !== undefined && RETRYABLE_STATUS.has(status)) return true;
    if (err.code !== undefined && RETRYABLE_CODES.has(err.code)) return true;
  }
  return false;
}

function extrairRetryAfter(err: unknown): number | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const valor = err.response?.headers["retry-after"];
  if (typeof valor !== "string") return undefined;
  const segundos = Number(valor);
  if (Number.isFinite(segundos)) return Math.min(segundos * 1000, 30_000);
  const data = Date.parse(valor);
  if (Number.isFinite(data)) return Math.min(Math.max(0, data - Date.now()), 30_000);
  return undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DataJudClient {
  constructor(private readonly opts: DataJudClientOptions) {}

  async buscarProcesso(
    alias: string,
    numeroNormalizado: string
  ): Promise<DataJudProcessoRaw | null> {
    const url = `${this.opts.baseUrl}/api_publica_${alias}/_search`;
    let tentativa = 0;

    for (;;) {
      try {
        const resposta = await this.postComTimeout(url, numeroNormalizado);
        const parsed = DataJudResponseSchema.safeParse(resposta.data);
        if (!parsed.success) {
          logger.warn(
            { alias, motivo: "schema_invalido", issues: parsed.error.issues.slice(0, 5) },
            "resposta do DataJud não validou"
          );
          throw new ApiError(
            502,
            API_ERROR_CODES.DATAJUD_SCHEMA_INVALID,
            "O DataJud retornou uma resposta inesperada.",
            { motivo: "resposta fora do schema esperado" }
          );
        }
        return parsed.data.hits.hits[0]?._source ?? null;
      } catch (err) {
        if (err instanceof ApiError) throw err;
        if (tentativa < this.opts.maxRetries && isRetryable(err)) {
          const retryAfter = extrairRetryAfter(err);
          const delay = retryAfter ?? this.opts.retryBaseMs * 2 ** tentativa;
          tentativa += 1;
          logger.warn(
            { alias, tentativa, delayMs: delay, motivo: isRetryable(err) },
            "falha transitória no DataJud, tentando novamente"
          );
          await sleep(delay);
          continue;
        }
        throw this.mapearErro(err, alias);
      }
    }
  }

  private async postComTimeout(url: string, numero: string): Promise<AxiosResponse<unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    try {
      return await axios.post(
        url,
        { query: { match: { numeroProcesso: numero } } },
        {
          headers: {
            Authorization: `APIKey ${this.opts.token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapearErro(err: unknown, alias: string): ApiError {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        return new ApiError(
          502,
          API_ERROR_CODES.DATAJUD_AUTH,
          "Falha de autenticação no serviço de dados processuais.",
          { alias }
        );
      }
      if (status === 429) {
        return new ApiError(
          502,
          API_ERROR_CODES.DATAJUD_RATE_LIMITED,
          "O serviço de dados processuais está sobrecarregado. Tente novamente em instantes.",
          { alias }
        );
      }
      if (status === 404) {
        return new ApiError(
          422,
          API_ERROR_CODES.TRIBUNAL_NAO_SUPORTADO,
          `O tribunal "${alias.toUpperCase()}" não está disponível no serviço de dados.`,
          { alias }
        );
      }
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" || this.isAbortError(err)) {
        return new ApiError(
          504,
          API_ERROR_CODES.DATAJUD_TIMEOUT,
          "O serviço de dados demorou para responder. Tente novamente em instantes.",
          { alias }
        );
      }
    }
    return new ApiError(
      502,
      API_ERROR_CODES.DATAJUD_INDISPONIVEL,
      "O serviço de dados processuais está indisponível no momento. Tente novamente em instantes.",
      { alias }
    );
  }

  private isAbortError(err: AxiosError): boolean {
    return err.code === "ERR_CANCELED" || err.code === "ABORT_ERR";
  }
}
