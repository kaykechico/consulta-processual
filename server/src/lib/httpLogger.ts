import { pinoHttp } from "pino-http";
import { stdSerializers } from "pino";
import { logger } from "./logger";

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req(req) {
      const base = stdSerializers.req(req);
      return { ...base, url: String(base.url).split("?")[0] };
    },
  },
});
