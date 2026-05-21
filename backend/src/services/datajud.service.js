import axios from "axios";
import https from "node:https";
import { listarAliasesDataJud } from "./cnj.service.js";
import { HttpError } from "../utils/http-error.js";
import { normalizarObjeto } from "../utils/text-normalizer.js";

const baseURL = process.env.DATAJUD_BASE_URL || "https://api-publica.datajud.cnj.jus.br/";
const timeout = Number(process.env.DATAJUD_TIMEOUT_MS || 25000);
const maxRetries = Number(process.env.DATAJUD_MAX_RETRIES || 2);
const retryBaseDelayMs = Number(process.env.DATAJUD_RETRY_BASE_DELAY_MS || 600);

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  maxFreeSockets: 6,
  timeout: timeout + 5000
});

let clienteDataJud;

function obterClienteDataJud() {
  if (clienteDataJud) {
    return clienteDataJud;
  }

  const apiKey = process.env.DATAJUD_API_KEY;

  if (!apiKey) {
    throw new HttpError(
      500,
      "CONFIGURACAO_INDISPONIVEL",
      "Configuração de autenticação indisponível no servidor."
    );
  }

  clienteDataJud = axios.create({
    baseURL,
    timeout,
    httpsAgent,
    responseEncoding: "utf8",
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 512 * 1024,
    validateStatus: (status) => status >= 200 && status < 300,
    headers: {
      Authorization: `APIKey ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
      "User-Agent": "consulta-juridica/1.0"
    },
    transformResponse: [
      function transformarResposta(data) {
        if (typeof data !== "string") {
          return data;
        }

        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
    ]
  });

  return clienteDataJud;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(error) {
  const status = error?.response?.status;
  const code = error?.code;

  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  return [
    "ECONNRESET",
    "ECONNABORTED",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "ENOTFOUND",
    "ECONNREFUSED",
    "ERR_SOCKET_CLOSED"
  ].includes(code);
}

async function executarComRetry(fn, signal = null) {
  let ultimaFalha;

  for (let tentativa = 0; tentativa <= maxRetries; tentativa += 1) {
    if (signal?.aborted) {
      throw new axios.Cancel("Busca cancelada pelo usuário ou timeout.");
    }

    try {
      return await fn();
    } catch (error) {
      ultimaFalha = error;

      if (axios.isCancel(error) || signal?.aborted) {
        throw error;
      }

      if (!isTransientError(error) || tentativa === maxRetries) {
        throw error;
      }

      const retryAfter = Number(error?.response?.headers?.["retry-after"]);
      const delay = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : retryBaseDelayMs * Math.pow(2, tentativa);

      if (signal) {
        let onAbort;
        const abortPromise = new Promise((_, reject) => {
          onAbort = () => reject(new axios.Cancel("Busca cancelada pelo usuário ou timeout."));
          signal.addEventListener("abort", onAbort);
        });
        try {
          await Promise.race([sleep(delay), abortPromise]);
        } finally {
          if (onAbort) {
            signal.removeEventListener("abort", onAbort);
          }
        }
      } else {
        await sleep(delay);
      }
    }
  }

  throw ultimaFalha;
}

function extrairHits(responseData) {
  const hits = responseData?.hits?.hits;
  return Array.isArray(hits) ? hits : [];
}

function normalizarNumeroProcesso(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function encontrarHitExato(hits, numeroProcesso) {
  const numeroAlvo = normalizarNumeroProcesso(numeroProcesso);

  return (
    hits.find(
      (hit) => normalizarNumeroProcesso(hit?._source?.numeroProcesso) === numeroAlvo
    ) || null
  );
}

async function consultarAlias(numeroProcesso, alias, signal = null) {
  const client = obterClienteDataJud();

  const body = {
    size: 3,
    query: {
      bool: {
        should: [
          { term: { numeroProcesso: { value: numeroProcesso } } },
          { match_phrase: { numeroProcesso: numeroProcesso } }
        ],
        minimum_should_match: 1
      }
    }
  };

  const response = await executarComRetry(
    () => client.post(`/${alias}/_search`, body, signal ? { signal } : {}),
    signal
  );
  const hits = extrairHits(response.data);
  const hit = encontrarHitExato(hits, numeroProcesso);

  if (!hit) {
    return null;
  }

  const hitNormalizado = normalizarObjeto(hit);

  return {
    tribunal: alias,
    data: {
      id: hitNormalizado._id || null,
      index: hitNormalizado._index || null,
      score: hitNormalizado._score ?? null,
      source: hitNormalizado._source || {},
      raw: hitNormalizado
    }
  };
}

async function consultarComConcorrenciaLimitada(numeroProcesso, aliases, limite, signal = null) {
  let indice = 0;
  let encontrado = null;
  let erroFatal = null;

  async function worker() {
    while (!encontrado && !erroFatal) {
      if (signal?.aborted) {
        break;
      }

      const posicao = indice;

      if (posicao >= aliases.length) {
        break;
      }

      indice += 1;
      const alias = aliases[posicao];

      try {
        const resultado = await consultarAlias(numeroProcesso, alias, signal);

        if (resultado && !encontrado) {
          encontrado = resultado;
        }
      } catch (error) {
        if (error instanceof HttpError) {
          erroFatal = error;
          break;
        }

        const status = error?.response?.status;

        if (status === 401 || status === 403) {
          erroFatal = error;
        }
      }
    }
  }

  const quantidadeWorkers = Math.max(1, Math.min(limite, aliases.length));
  await Promise.all(Array.from({ length: quantidadeWorkers }, () => worker()));

  if (erroFatal) {
    throw erroFatal;
  }

  return encontrado;
}

function converterErroDataJud(error) {
  if (error instanceof HttpError) {
    throw error;
  }

  const status = error?.response?.status;
  const code = error?.code;

  if (status === 404) {
    return null;
  }

  if (axios.isCancel(error) || code === "ERR_CANCELED") {
    throw new HttpError(
      504,
      "TEMPO_LIMITE_REQUISICAO",
      "O tempo limite para conclusão da consulta foi excedido. Realize nova tentativa."
    );
  }

  if (status === 401 || status === 403) {
    throw new HttpError(
      502,
      "BASE_PUBLICA_AUTENTICACAO_INVALIDA",
      "Não foi possível autenticar a requisição junto à base pública consultada."
    );
  }

  if (status === 429) {
    throw new HttpError(
      429,
      "BASE_PUBLICA_LIMITE_REQUISICOES",
      "A base pública consultada limitou temporariamente o volume de requisições. Realize nova tentativa em instantes."
    );
  }

  if (code === "ECONNRESET" || code === "ERR_SOCKET_CLOSED") {
    throw new HttpError(
      502,
      "BASE_PUBLICA_CONEXAO_INTERROMPIDA",
      "A conexão com a base pública consultada foi interrompida. Realize nova tentativa."
    );
  }

  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    throw new HttpError(
      504,
      "BASE_PUBLICA_TEMPO_LIMITE_EXCEDIDO",
      "O tempo limite para consulta à base pública foi excedido. Realize nova tentativa."
    );
  }

  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    throw new HttpError(
      502,
      "BASE_PUBLICA_COMUNICACAO_INDISPONIVEL",
      "Não foi possível estabelecer comunicação com a base pública consultada."
    );
  }

  if (code === "ECONNREFUSED") {
    throw new HttpError(
      502,
      "BASE_PUBLICA_CONEXAO_RECUSADA",
      "A conexão com a base pública consultada foi recusada."
    );
  }

  if (status >= 500) {
    throw new HttpError(
      502,
      "BASE_PUBLICA_INDISPONIVEL",
      "A base pública consultada encontra-se indisponível no momento. Realize nova tentativa posteriormente."
    );
  }

  throw new HttpError(
    502,
    "CONSULTA_PUBLICA_NAO_CONCLUIDA",
    "A consulta junto à base pública não pôde ser concluída no momento."
  );
}

export async function consultarProcessoDataJud(numeroProcesso, tribunalDetectado, signal = null) {
  try {
    if (tribunalDetectado) {
      const resultado = await consultarAlias(numeroProcesso, tribunalDetectado, signal);

      if (resultado) {
        return {
          ...resultado,
          buscaAmpla: false
        };
      }
    }

    const fallbackAtivo =
      String(process.env.DATAJUD_ENABLE_FALLBACK || "true").toLowerCase() === "true";

    if (!fallbackAtivo) {
      return null;
    }

    const aliases = listarAliasesDataJud().filter((alias) => alias !== tribunalDetectado);

    const resultadoFallback = await consultarComConcorrenciaLimitada(
      numeroProcesso,
      aliases,
      Number(process.env.DATAJUD_FALLBACK_CONCURRENCY || 2),
      signal
    );

    if (!resultadoFallback) {
      return null;
    }

    return {
      ...resultadoFallback,
      buscaAmpla: true
    };
  } catch (error) {
    return converterErroDataJud(error);
  }
}