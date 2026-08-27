import { ApiError } from "../utils/errors";
import { type CacheStore, LruCache } from "../lib/cache";
import { RequestCoalescer } from "../lib/coalescer";
import { env } from "../config/env";
import { DataJudClient } from "./datajud.client";
import { metrics } from "../lib/metrics";
import { logger } from "../lib/logger";
import type { DataJudProcessoRaw } from "./datajud.schemas";
import {
  normalizeCNJ,
  validateCNJ,
  getTribunalFromCNJ,
  API_ERROR_CODES,
  type Processo,
  type Tribunal,
} from "@consulta/shared";
import { normalizarProcesso } from "./processo.normalizer";

export interface ProcessoServiceOptions {
  ttlMs: number;
  negativeTtlMs: number;
  maxEntries: number;
}

export class ProcessoService {
  private readonly cache: CacheStore<string, Processo | null>;
  private readonly coalescer = new RequestCoalescer<string, Processo | null>();

  constructor(
    private readonly cliente: DataJudClient,
    private readonly opts: ProcessoServiceOptions,
    cacheStore?: CacheStore<string, Processo | null>
  ) {
    this.cache = cacheStore ?? new LruCache(opts.maxEntries);
  }

  async buscar(input: string): Promise<Processo | null> {
    const numero = normalizeCNJ(input);
    metrics.incConsultasTotal();
    if (!validateCNJ(numero)) {
      metrics.incInvalidas();
      throw new ApiError(
        422,
        API_ERROR_CODES.CNJ_INVALIDO,
        "Número de CNJ inválido. Verifique e tente novamente."
      );
    }

    const tribunal = getTribunalFromCNJ(numero);
    if (!tribunal) {
      metrics.incInvalidas();
      throw new ApiError(
        422,
        API_ERROR_CODES.TRIBUNAL_NAO_SUPORTADO,
        "O tribunal deste número CNJ não é suportado pelo serviço de dados processuais."
      );
    }

    if (tribunal.suportadoDatajud === false) {
      metrics.incInvalidas();
      throw new ApiError(
        422,
        API_ERROR_CODES.TRIBUNAL_NAO_SUPORTADO,
        `Tribunal identificado (${tribunal.nome}), mas não disponível na API Pública do DataJud.`
      );
    }

    const cacheKey = `${numero}:${tribunal.alias}`;
    const hit = this.cache.get(cacheKey);
    if (hit !== undefined) {
      metrics.incCacheHit();
      if (hit === null) metrics.incCacheNegativeHit();
      logger.info({ tribunal: tribunal.alias, cache: "hit" }, "consulta cache hit");
      if (hit === null) metrics.incNotFound();
      else metrics.incSucesso();
      return hit;
    }
    metrics.incCacheMiss();

    const resultado = await this.coalescer.run(cacheKey, () =>
      this.consultarDataJud(numero, tribunal)
    );
    this.cache.set(cacheKey, resultado, resultado ? this.opts.ttlMs : this.opts.negativeTtlMs);
    if (resultado) metrics.incSucesso();
    else metrics.incNotFound();
    logger.info(
      { tribunal: tribunal.alias, cache: "miss", encontrado: !!resultado },
      "consulta DataJud concluída"
    );
    return resultado;
  }

  private async consultarDataJud(numero: string, tribunal: Tribunal): Promise<Processo | null> {
    const bruto = await this.cliente.buscarProcesso(tribunal.alias, numero);
    if (!bruto) return null;
    if (isProcessoSigiloso(bruto)) {
      throw new ApiError(
        403,
        API_ERROR_CODES.PROCESSO_SIGILOSO,
        "Processo em segredo de justiça ou com nível de sigilo restrito. Dados não disponíveis para consulta pública.",
        { tribunal: tribunal.alias }
      );
    }
    return normalizarProcesso(bruto, numero, tribunal);
  }
}

export function isProcessoSigiloso(bruto: DataJudProcessoRaw): boolean {
  if (flagSigilo(bruto.segredoJustica) || flagSigilo(bruto.sigiloso)) return true;

  if (bruto.grauSigilo != null && bruto.grauSigilo !== "") {
    const grau = Number(bruto.grauSigilo);
    if (!Number.isNaN(grau) && grau > 0) return true;
  }

  if (bruto.nivelSigilo != null && bruto.nivelSigilo !== "") {
    if (typeof bruto.nivelSigilo === "number" && bruto.nivelSigilo > 0) {
      return true;
    }
    if (typeof bruto.nivelSigilo === "string") {
      const trimmed = bruto.nivelSigilo.trim().toUpperCase();
      const num = Number(trimmed);
      if (!Number.isNaN(num) && num > 0) return true;
      if (
        trimmed === "SIGILOSO" ||
        trimmed === "SEGREDO_DE_JUSTICA" ||
        trimmed === "SEGREDO DE JUSTICA" ||
        trimmed === "SEGREDO DE JUSTIÇA" ||
        trimmed === "CONFIDENCIAL" ||
        trimmed === "RESTRITO"
      ) {
        return true;
      }
    }
  }

  return false;
}

function flagSigilo(valor: unknown): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

export const processoService = new ProcessoService(
  new DataJudClient({
    baseUrl: env.DATAJUD_BASE_URL,
    token: env.DATAJUD_TOKEN,
    timeoutMs: env.DATAJUD_TIMEOUT_MS,
    maxRetries: env.DATAJUD_MAX_RETRIES,
    retryBaseMs: env.DATAJUD_RETRY_BASE_MS,
    rateLimitMax: env.DATAJUD_RATE_LIMIT_MAX,
    rateLimitWindowMs: env.DATAJUD_RATE_LIMIT_WINDOW_MS,
    maxConcurrency: env.DATAJUD_MAX_CONCURRENCY,
    maxResponseBytes: env.DATAJUD_MAX_RESPONSE_BYTES,
  }),
  {
    ttlMs: env.CACHE_TTL_SECONDS * 1000,
    negativeTtlMs: env.CACHE_NEGATIVE_TTL_SECONDS * 1000,
    maxEntries: env.CACHE_MAX_ENTRIES,
  }
);
