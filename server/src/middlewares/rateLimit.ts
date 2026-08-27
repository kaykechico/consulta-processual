import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { FixedWindowRateLimiter } from "../lib/rateLimit";
import { metrics } from "../lib/metrics";
import { API_ERROR_CODES } from "@consulta/shared";

export const rateLimiter = new FixedWindowRateLimiter(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS);

const RE_IP = /^(?:(?:\d{1,3}\.){3}\d{1,3}|[a-fA-F0-9:]{2,39})$/;

export function extrairIpCliente(req: Request): string {
  if (env.TRUST_PROXY !== "false") {
    if (env.TRUST_CF) {
      const cfIp = req.headers["cf-connecting-ip"];
      if (typeof cfIp === "string" && RE_IP.test(cfIp.trim())) {
        return cfIp.trim();
      }
    }
    if (req.ip && req.ip.trim() && RE_IP.test(req.ip.trim())) {
      return req.ip.trim();
    }
  }
  return req.socket?.remoteAddress || "127.0.0.1";
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "OPTIONS") {
    return next();
  }

  const ip = extrairIpCliente(req);
  const result = rateLimiter.check(ip);
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));

  res.setHeader("X-RateLimit-Limit", String(env.RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    metrics.incRateLimitHit();
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res
      .status(429)
      .set("Cache-Control", "no-store")
      .json({
        error: {
          code: API_ERROR_CODES.RATE_LIMITED,
          message: "Muitas requisições. Aguarde um instante e tente novamente.",
          requestId: req.id,
        },
      });
    return;
  }
  next();
}
