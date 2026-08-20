import axios from "axios";
import type { Processo } from "../../../shared/src/schemas";

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
  baseURL: "/api",
  timeout: 30000,
});

export async function buscarProcesso(numero: string, signal?: AbortSignal): Promise<Processo> {
  try {
    const { data } = await api.post<{ processo: Processo }>(
      "/v1/processos/consulta",
      { numero },
      { signal }
    );
    return data.processo;
  } catch (error) {
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
}
