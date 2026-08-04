import axios from "axios";
import type { ProcessoDTO } from "../types/processo";

export class ProcessoError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProcessoError";
  }
}

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

export async function buscarProcesso(numero: string): Promise<ProcessoDTO> {
  try {
    const { data } = await api.get<{ processo: ProcessoDTO | null }>(
      "/processo",
      { params: { numero } },
    );
    if (!data.processo) {
      throw new ProcessoError("NAO_ENCONTRADO", "Processo não encontrado.");
    }
    return data.processo;
  } catch (error) {
    if (error instanceof ProcessoError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as
        | { error?: { code?: string; message?: string } }
        | undefined;
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