import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { FixedWindowRateLimiter } from "../lib/rateLimit";

export const rateLimiter = new FixedWindowRateLimiter(env.RATE_LIMIT_MAX, env.RATE_LIMIT_WINDOW_MS);

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "desconhecido";
  const result = rateLimiter.check(ip);
  res.setHeader("X-RateLimit-Limit", String(env.RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
  if (!result.allowed) {
    res.setHeader("Retry-After", String(Math.ceil((result.resetAt - Date.now()) / 1000)));
    res
      .status(429)
      .set("Cache-Control", "no-store")
      .json({
        error: {
          code: "RATE_LIMITED",
          message: "Muitas requisições. Aguarde um instante e tente novamente.",
          requestId: req.id,
        },
      });
    return;
  }
  next();
}
