import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/errors";
import { processoService } from "../services/processo.service";

const querySchema = z.object({
  numero: z.string().trim().min(1, "Informe um número de processo."),
});

export async function getProcesso(req: Request, res: Response): Promise<void> {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    throw new ApiError(422, "NUMERO_OBRIGATORIO", query.error.issues[0]?.message ?? "Número inválido.");
  }
  const processo = await processoService.buscar(query.data.numero);
  if (!processo) {
    throw new ApiError(
      404,
      "NAO_ENCONTRADO",
      "Nenhum processo encontrado com este número. Verifique se o número CNJ está correto."
    );
  }
  res.json({ processo });
}
