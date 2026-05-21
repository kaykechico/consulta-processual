import { HttpError } from "../utils/http-error.js";

export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number(
    error instanceof HttpError ? error.statusCode : error.statusCode || 500
  );

  const payload = {
    success: false,
    error: error.error || "ERRO_INTERNO",
    message: error.message || "A requisição não pôde ser processada no momento."
  };

  console.error({
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: payload.error,
    message: payload.message,
    code: error.code,
    upstreamStatus: error?.response?.status
  });

  res.status(statusCode).json(payload);
}