import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../utils/errors";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "ROTA_NAO_ENCONTRADA", message: "Rota não encontrada." } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNO", message: "Erro interno no servidor." } });
};
