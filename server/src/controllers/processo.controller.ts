import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../utils/errors";
import { processoService } from "../services/processo.service";
import { ApiSuccessSchema, API_ERROR_CODES, TRIBUNAIS } from "@consulta/shared";
import { env } from "../config/env";

const numeroSchema = z.string().trim().min(1, "Informe um número de processo.");

async function responderComProcesso(
  numero: unknown,
  res: Response,
  mensagemErro = "Informe um número de processo."
): Promise<void> {
  const parsed = numeroSchema.safeParse(numero);
  if (!parsed.success) {
    throw new ApiError(422, API_ERROR_CODES.NUMERO_OBRIGATORIO, mensagemErro);
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

export async function consultarProcesso(req: Request, res: Response): Promise<void> {
  const numero = req.method === "POST" ? req.body?.numero : req.query.numero;
  await responderComProcesso(numero, res, "Informe um número de processo no campo 'numero'.");
}

export async function consultarProcessoPorParam(req: Request, res: Response): Promise<void> {
  await responderComProcesso(
    req.params.numero,
    res,
    "Informe um número de processo no parâmetro da URL."
  );
}

export function listarTribunais(_req: Request, res: Response): void {
  res.status(200).set("Cache-Control", "public, max-age=86400").json({
    tribunais: TRIBUNAIS,
    total: TRIBUNAIS.length,
  });
}

export function healthHandler(_req: Request, res: Response): void {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
}

export function readyHandler(_req: Request, res: Response): void {
  const ok = Boolean(env.DATAJUD_TOKEN || env.NODE_ENV === "test");
  if (!ok) {
    res.status(503).json({ status: "not_ready", reason: "configuração pendente" });
    return;
  }

  res.status(200).json({ status: "ready" });
}
