import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  DATAJUD_TOKEN: z.string().min(1),
  DATAJUD_BASE_URL: z
    .string()
    .url()
    .default("https://api-publica.datajud.cnj.jus.br"),
  DATAJUD_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuração inválida. Verifique o arquivo server/.env:");
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
