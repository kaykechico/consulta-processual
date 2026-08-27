import axios from "axios";
import { ApiSuccessSchema, type Processo } from "@consulta/shared";
import { z } from "zod";

export class ProcessoError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ProcessoError";
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 30000,
});

const TribunaisResponseSchema = z.object({
  tribunais: z.array(z.object({ alias: z.string(), nome: z.string() })),
});

export async function buscarTribunais(): Promise<{ alias: string; nome: string }[]> {
  try {
    const { data } = await api.get("/v1/tribunais");
    const parsed = TribunaisResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new ProcessoError("RESPOSTA_INVALIDA", "O servidor retornou uma resposta invÃ¡lida.");
    }
    return parsed.data.tribunais;
  } catch (e) {
    throw tratarErro(e);
  }
}

export async function buscarProcesso(numero: string, signal?: AbortSignal): Promise<Processo> {
  try {
    const { data } = await api.get<{ processo: Processo }>(
      `/v1/processos/${encodeURIComponent(numero)}`,
      { signal }
    );
    const parsed = ApiSuccessSchema.safeParse(data);
    if (!parsed.success) {
      throw new ProcessoError("RESPOSTA_INVALIDA", "O servidor retornou uma resposta invÃ¡lida.");
    }
    return parsed.data.processo;
  } catch (e) {
    throw tratarErro(e);
  }
}

function tratarErro(error: unknown): never {
  if (error instanceof ProcessoError) throw error;
  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") {
      throw new ProcessoError("CANCELADO", "Consulta cancelada.");
    }
    const body = error.response?.data as
      { error?: { code?: string; message?: string } } | undefined;
    if (body?.error?.message) {
      throw new ProcessoError(body.error.code ?? "ERRO", body.error.message);
    }
    if (error.code === "ECONNABORTED") {
      throw new ProcessoError("TIMEOUT", "A consulta demorou demais. Tente novamente.");
    }
    throw new ProcessoError("SEM_CONEXAO", "Não foi possível conectar ao servidor.");
  }
  throw new ProcessoError("ERRO", "Ocorreu um erro inesperado na consulta.");
}
