import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/errors";
import { processoService } from "../services/processo.service";
import { ApiSuccessSchema, API_ERROR_CODES } from "../../../shared/src/schemas.js";

const numeroSchema = z.string().trim().min(1, "Informe um número de processo.");

export async function consultarProcesso(req: Request, res: Response): Promise<void> {
  const numero = req.method === "POST" ? req.body?.numero : req.query.numero;
  const parsed = numeroSchema.safeParse(numero);
  if (!parsed.success) {
    throw new ApiError(
      422,
      "NUMERO_OBRIGATORIO",
      "Informe um número de processo no campo 'numero'."
    );
  }

  const processo = await processoService.buscar(parsed.data);
  if (!processo) {
    throw new ApiError(
      404,
      API_ERROR_CODES.PROCESSO_NAO_ENCONTRADO,
      "Nenhum processo encontrado com este número. Verifique se o número CNJ está correto."
    );
  }
  const resposta = ApiSuccessSchema.parse({ processo });
  res.status(200).set("Cache-Control", "no-store").json(resposta);
}

export function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok" });
}

export function readyHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: "ready" });
}
