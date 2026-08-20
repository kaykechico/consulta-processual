import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../utils/errors";
import { logger } from "../lib/logger";
import { API_ERROR_CODES } from "../../../shared/src/schemas.js";

export const notFound: RequestHandler = (req, res) => {
  res
    .status(404)
    .set("Cache-Control", "no-store")
    .json({
      error: { code: "ROTA_NAO_ENCONTRADA", message: "Rota não encontrada.", requestId: req.id },
    });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.id;
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
