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

export function resolverTrustProxy(v: string): boolean | number | string | string[] {
  const trimmed = v.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "false") return false;
  if (lower === "true") return 1;
  const n = Number(lower);
  if (Number.isInteger(n) && n >= 0) return n;
  if (["loopback", "linklocal", "uniquelocal"].includes(lower)) return lower;
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return trimmed;
}

export function verificarTrustProxyConfig(
  envConfig: { NODE_ENV: string; TRUST_PROXY: string; TRUST_CF: boolean },
  log: typeof logger
): void {
  const trustProxyVal = resolverTrustProxy(envConfig.TRUST_PROXY);
  if (envConfig.NODE_ENV === "production" && trustProxyVal === false && !envConfig.TRUST_CF) {
    log.warn(
      { trustProxy: envConfig.TRUST_PROXY, trustCf: envConfig.TRUST_CF },
      "Ambiente de produção sem TRUST_PROXY ou TRUST_CF configurados. Clientes podem compartilhar o mesmo bucket de rate limit. Configure TRUST_PROXY=1 (Render/Railway/Fly/Nginx) ou TRUST_CF=true/TRUST_PROXY=2 (Cloudflare)."
    );
  }
}

verificarTrustProxyConfig(env, logger);

app.disable("x-powered-by");
app.set("trust proxy", resolverTrustProxy(env.TRUST_PROXY));

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
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    hsts: isProduction ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  })
);
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});
app.use(cors({ origin: corsOrigins }));
app.use(compression());
app.use(httpLogger);
app.use(express.json({ limit: "10kb" }));

app.use("/api", apiRouter);

function resolverClientDist(caminhoConfigurado: string): string {
  if (path.isAbsolute(caminhoConfigurado)) return caminhoConfigurado;
  const candidatos = [
    path.resolve(process.cwd(), caminhoConfigurado),
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(process.cwd(), "../client/dist"),
    path.resolve(__dirname, "../../../", caminhoConfigurado),
    path.resolve(__dirname, "../../../../", caminhoConfigurado),
    path.resolve(__dirname, "../../client/dist"),
    path.resolve(__dirname, "../../../client/dist"),
  ].filter((cand, index, lista) => lista.indexOf(cand) === index);
  for (const cand of candidatos) {
    if (fs.existsSync(cand)) return cand;
  }
  return path.resolve(process.cwd(), caminhoConfigurado);
}

if (isProduction) {
  const clientDist = resolverClientDist(env.CLIENT_DIST);
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
