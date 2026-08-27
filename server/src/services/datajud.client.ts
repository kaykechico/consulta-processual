import axios, { type AxiosError, type AxiosResponse } from "axios";
import { ApiError } from "../utils/errors";
import { logger } from "../lib/logger";
import { metrics } from "../lib/metrics";
import { DataJudResponseSchema, type DataJudProcessoRaw } from "./datajud.schemas";
import { selecionarMelhorHit } from "./datajud.selector";
import { API_ERROR_CODES } from "@consulta/shared";

export interface DataJudClientOptions {
  baseUrl: string;
  token: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
  maxConcurrency?: number;
  maxResponseBytes?: number;
}

class Semaphore {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.max) {
      this.active += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        this.active -= 1;
        const next = this.queue.shift();
        if (next) {
          this.active += 1;
          next();
        }
      };
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        let released = false;
        resolve(() => {
          if (released) return;
          released = true;
          this.active -= 1;
          const next = this.queue.shift();
          if (next) {
            this.active += 1;
            next();
          }
        });
      });
    });
  }
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRatePerMs: number;

  constructor(max: number, windowMs: number) {
    this.capacity = max;
    this.tokens = max;
    this.refillRatePerMs = max / windowMs;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    const now = Date.now();
    const elapsed = Math.max(0, now - this.lastRefill);
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRatePerMs);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
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

function motivoRetry(err: unknown): string {
  if (!axios.isAxiosError(err)) return "unknown";
  if (err.response?.status) return `http_${err.response.status}`;
  if (err.code) return err.code;
  return "network";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DataJudClient {
  private readonly semaphore: Semaphore;
  private readonly limiter: TokenBucketRateLimiter;

  constructor(private readonly opts: DataJudClientOptions) {
    this.semaphore = new Semaphore(opts.maxConcurrency ?? 4);
    this.limiter = new TokenBucketRateLimiter(
      opts.rateLimitMax ?? 100,
      opts.rateLimitWindowMs ?? 60_000
    );
  }

  async buscarProcesso(
    alias: string,
    numeroNormalizado: string
  ): Promise<DataJudProcessoRaw | null> {
    const release = await this.semaphore.acquire();
    try {
      const url = `${this.opts.baseUrl}/api_publica_${alias}/_search`;
      let tentativa = 0;
      const deadlineMs =
        this.opts.timeoutMs * (this.opts.maxRetries + 1) +
        this.opts.retryBaseMs * 2 ** (this.opts.maxRetries + 1);
      const deadlineAt = Date.now() + deadlineMs;

      for (;;) {
        const remaining = deadlineAt - Date.now();
        if (remaining <= 0) {
          throw new ApiError(
            504,
            API_ERROR_CODES.DATAJUD_TIMEOUT,
            "Tempo limite global excedido.",
            {
              alias,
            }
          );
        }
        if (!this.limiter.consume()) {
          metrics.incDatajudFailure();
          throw new ApiError(
            429,
            API_ERROR_CODES.DATAJUD_RATE_LIMITED,
            "Limite global de consultas ao DataJud atingido. Aguarde um instante.",
            { alias }
          );
        }
        const timeoutMs = Math.min(this.opts.timeoutMs, remaining);
        const inicio = Date.now();
        try {
          metrics.incDatajudRequest();
          const resposta = await this.postComTimeout(url, numeroNormalizado, timeoutMs);
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
          return selecionarMelhorHit(parsed.data.hits.hits, numeroNormalizado);
        } catch (err) {
          if (err instanceof ApiError) throw err;
          if (tentativa < this.opts.maxRetries && isRetryable(err)) {
            if (Date.now() >= deadlineAt) {
              logger.warn(
                { alias, tentativa, motivo: motivoRetry(err) },
                "deadline global atingido, abortando retries"
              );
              throw this.mapearErro(err, alias);
            }
            const retryAfter = extrairRetryAfter(err);
            let delay = retryAfter ?? this.opts.retryBaseMs * 2 ** tentativa;
            const jitter = 0.5 + Math.random();
            delay = Math.round(delay * jitter);
            const restante = deadlineAt - Date.now();
            if (delay > restante) delay = Math.max(0, restante);
            if (restante <= 0) throw this.mapearErro(err, alias);
            tentativa += 1;
            metrics.incDatajudRetry();
            logger.warn(
              { alias, tentativa, delayMs: delay, motivo: motivoRetry(err) },
              "falha transitória no DataJud, tentando novamente"
            );
            await sleep(delay);
            continue;
          }
          metrics.incDatajudFailure();
          throw this.mapearErro(err, alias);
        } finally {
          metrics.addLatency(Date.now() - inicio);
        }
      }
    } finally {
      release();
    }
  }

  private async postComTimeout(
    url: string,
    numero: string,
    timeoutMs: number
  ): Promise<AxiosResponse<unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await axios.post(
        url,
        {
          size: 10,
          query: { match: { numeroProcesso: numero } },
        },
        {
          headers: {
            Authorization: `APIKey ${this.opts.token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          maxContentLength: this.opts.maxResponseBytes ?? 10 * 1024 * 1024,
          maxBodyLength: this.opts.maxResponseBytes ?? 10 * 1024 * 1024,
        }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapearErro(err: unknown, alias: string): ApiError {
    if (axios.isAxiosError(err)) {
      if (
        err.code === "ERR_FR_MAX_BODY_LENGTH_EXCEEDED" ||
        (typeof err.message === "string" && err.message.includes("maxContentLength"))
      ) {
        return new ApiError(
          502,
          API_ERROR_CODES.DATAJUD_SCHEMA_INVALID,
          "A resposta do serviço de dados excedeu o limite máximo permitido.",
          { alias }
        );
      }
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
