import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 90000);
const MAX_RETRIES = Number(import.meta.env.VITE_API_MAX_RETRIES || 1);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json"
  }
});

const MENSAGENS_ERRO = {
  LIMITE_REQUISICOES_EXCEDIDO:
    "O limite temporário de consultas foi atingido. Aguarde alguns instantes e tente novamente.",
  BASE_PUBLICA_LIMITE_REQUISICOES:
    "A base pública consultada limitou temporariamente o volume de requisições. Tente novamente em instantes.",
  BASE_PUBLICA_TEMPO_LIMITE_EXCEDIDO:
    "A consulta demorou mais que o esperado. Tente novamente.",
  BASE_PUBLICA_INDISPONIVEL:
    "A base pública consultada está indisponível no momento. Tente novamente mais tarde.",
  REGISTRO_PROCESSUAL_NAO_LOCALIZADO:
    "Não foram localizados registros processuais públicos para a numeração informada.",
  NUMERACAO_PROCESSUAL_INVALIDA:
    "A numeração processual informada é inválida. Informe número CNJ com 20 dígitos.",
  TEMPO_LIMITE_REQUISICAO:
    "O tempo limite para conclusão da consulta foi excedido. Realize nova tentativa.",
  SERVIDOR_INDISPONIVEL:
    "Não foi possível estabelecer comunicação com o servidor de consulta.",
  TEMPO_LIMITE_EXCEDIDO:
    "O tempo limite para conclusão da consulta foi excedido. Realize nova tentativa."
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function criarErroLocal(error, message) {
  return {
    response: {
      data: {
        success: false,
        error,
        message
      }
    }
  };
}

function isCancelado(error) {
  return axios.isCancel(error) || error?.code === "ERR_CANCELED";
}

function isErroTransitório(error) {
  const status = error?.response?.status;
  const code = error?.code;

  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  return ["ECONNABORTED", "ECONNRESET", "ETIMEDOUT", "ERR_NETWORK"].includes(code);
}

function normalizarErro(error) {
  if (isCancelado(error)) {
    return criarErroLocal("CONSULTA_CANCELADA", "Consulta cancelada.");
  }

  if (error?.code === "ECONNABORTED") {
    return criarErroLocal(
      "TEMPO_LIMITE_EXCEDIDO",
      MENSAGENS_ERRO.TEMPO_LIMITE_EXCEDIDO
    );
  }

  if (!error?.response) {
    return criarErroLocal(
      "SERVIDOR_INDISPONIVEL",
      MENSAGENS_ERRO.SERVIDOR_INDISPONIVEL
    );
  }

  const payload = error.response.data || {};
  const codigo = payload.error;
  const mensagemPadrao =
    payload.message || "A consulta processual não pôde ser concluída no momento.";

  if (codigo && MENSAGENS_ERRO[codigo]) {
    return {
      response: {
        data: {
          success: false,
          error: codigo,
          message: MENSAGENS_ERRO[codigo]
        }
      }
    };
  }

  return {
    response: {
      data: {
        success: false,
        error: codigo || "ERRO_CONSULTA",
        message: mensagemPadrao
      }
    }
  };
}

export async function consultarProcesso(numeroProcesso, options = {}) {
  const { signal } = options;
  let ultimoErro;

  for (let tentativa = 0; tentativa <= MAX_RETRIES; tentativa += 1) {
    if (signal?.aborted) {
      throw normalizarErro({ code: "ERR_CANCELED" });
    }

    try {
      const response = await api.post(
        "/api/processos/consultar",
        { numeroProcesso },
        { signal }
      );

      if (response.data?.success === false) {
        throw {
          response: {
            data: response.data
          }
        };
      }

      return response.data;
    } catch (error) {
      if (isCancelado(error)) {
        throw normalizarErro(error);
      }

      ultimoErro = error;

      const status = error?.response?.status;

      if (status === 404 || status === 400) {
        throw normalizarErro(error);
      }

      if (!isErroTransitório(error) || tentativa === MAX_RETRIES) {
        throw normalizarErro(error);
      }

      await sleep(500 * Math.pow(2, tentativa));
    }
  }

  throw normalizarErro(ultimoErro);
}

export async function verificarConexaoApi(options = {}) {
  try {
    const response = await api.get("/health", {
      timeout: 8000,
      signal: options.signal
    });

    return response.data?.status === "ok";
  } catch (error) {
    if (isCancelado(error)) {
      return false;
    }

    return false;
  }
}
