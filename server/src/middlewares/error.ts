import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/errors";
import { logger } from "../lib/logger";
import { API_ERROR_CODES } from "@consulta/shared";

function isJsonParseError(err: unknown): err is Error & { status?: number; type?: string } {
  if (!err || typeof err !== "object") return false;
  const candidate = err as { status?: unknown; type?: unknown };
  return candidate.type === "entity.parse.failed" && candidate.status === 400;
}

export const notFound: RequestHandler = (req, res) => {
  res
    .status(404)
    .set("Cache-Control", "no-store")
    .json({
      error: {
        code: API_ERROR_CODES.ROTA_NAO_ENCONTRADA,
        message: "Rota não encontrada.",
        requestId: req.id,
      },
    });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.id;
  if (isJsonParseError(err)) {
    logger.warn({ requestId }, "corpo JSON inválido");
    res
      .status(400)
      .set("Cache-Control", "no-store")
      .json({
        error: {
          code: API_ERROR_CODES.JSON_INVALIDO,
          message: "O corpo da requisição precisa conter um JSON válido.",
          requestId,
        },
      });
    return;
  }
  if (err instanceof ApiError) {
    logger.warn(
      { requestId, code: err.code, status: err.status, details: err.details },
      "erro controlado"
    );
    res
      .status(err.status)
      .set("Cache-Control", "no-store")
      .json({ error: { code: err.code, message: err.message, requestId } });
    return;
  }
  if (err instanceof ZodError) {
    logger.warn({ requestId, issues: err.issues }, "erro de validação Zod");
    res
      .status(422)
      .set("Cache-Control", "no-store")
      .json({
        error: {
          code: API_ERROR_CODES.CNJ_INVALIDO,
          message: "Parâmetros inválidos na requisição.",
          requestId,
        },
      });
    return;
  }
  logger.error({ requestId, err }, "erro interno não tratado");
  res
    .status(500)
    .set("Cache-Control", "no-store")
    .json({
      error: {
        code: API_ERROR_CODES.ERRO_INTERNO,
        message: "Erro interno no servidor.",
        requestId,
      },
    });
};
