import { z } from "zod";

const FORBIDDEN_SECRET_PATTERN = /^VITE_.*(TOKEN|SECRET|KEY|PASSWORD|AUTH|CREDENTIAL|PRIVATE)/i;

export const ClientEnvSchema = z
  .record(z.string(), z.string().optional())
  .superRefine((envRecord, ctx) => {
    for (const key of Object.keys(envRecord)) {
      if (FORBIDDEN_SECRET_PATTERN.test(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Segredo detectado no ambiente do cliente (${key}). Credenciais nunca devem ter prefixo VITE_.`,
        });
      }
    }
  });

export function validarViteEnv(
  envObj: Record<string, string | undefined>
): Record<string, string | undefined> {
  return ClientEnvSchema.parse(envObj);
}
