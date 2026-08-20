import path from "node:path";
import fs from "node:fs";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env, corsOrigins, isProduction } from "./config/env";
import { httpLogger } from "./lib/httpLogger";
import { logger } from "./lib/logger";
import { rateLimiter } from "./middlewares/rateLimit";
import { apiRouter } from "./routes/processo.routes";
import { notFound, errorHandler } from "./middlewares/error";

export { rateLimiter };

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY === "true" ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false,
    hsts: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: corsOrigins }));
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(httpLogger);

app.use("/api", apiRouter);

if (isProduction) {
  const clientDist = path.isAbsolute(env.CLIENT_DIST)
    ? env.CLIENT_DIST
    : path.resolve(__dirname, "../../../", env.CLIENT_DIST);
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { maxAge: "1h", index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    logger.warn({ clientDist }, "client/dist não encontrado; somente a API será servida");
  }
}

app.use(notFound);
app.use(errorHandler);
