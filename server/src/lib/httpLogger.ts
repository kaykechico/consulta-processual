import { pinoHttp } from "pino-http";
import { logger } from "./logger";

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req: unknown, res: { statusCode: number }, err: unknown) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req: unknown) => {
      const obj = req as Record<string, unknown>;
      if (!obj || typeof obj !== "object") return { url: "" };
      const rawValue = (obj as { url?: unknown }).url;
      const rawStr = typeof rawValue === "string" ? rawValue : "";
      const url = rawStr
        .split("?")[0]
        .replace(/\d{20}|\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g, "[REDACTED]");
      return {
        url,
        method: (obj as { method?: unknown }).method,
        id: (obj as { id?: unknown }).id,
      };
    },
  },
} as unknown as never);
