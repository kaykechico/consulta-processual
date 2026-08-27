import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATAJUD_TOKEN: z.string().min(1),
  DATAJUD_BASE_URL: z.string().url().default("https://api-publica.datajud.cnj.jus.br"),
  DATAJUD_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  DATAJUD_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  DATAJUD_RETRY_BASE_MS: z.coerce.number().int().positive().default(250),
  DATAJUD_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  DATAJUD_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  DATAJUD_MAX_CONCURRENCY: z.coerce.number().int().positive().default(4),
  DATAJUD_MAX_RESPONSE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  CACHE_NEGATIVE_TTL_SECONDS: z.coerce.number().int().positive().default(30),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(500),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  TRUST_PROXY: z.string().default("false"),
  TRUST_CF: z.coerce.boolean().default(false),
  CLIENT_DIST: z.string().default("../client/dist"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuração inválida. Verifique as variáveis de ambiente:");
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
