import axios from "axios";
import { ApiError } from "../utils/errors";

type Json = Record<string, any>;

export interface DataJudClienteOptions {
  baseUrl: string;
  token: string;
  timeoutMs: number;
}

const RETRY_DELAY_MS = 800;

export class DataJudCliente {
  constructor(private readonly opts: DataJudClienteOptions) {}

  async buscarProcesso(sigla: string, numero: string): Promise<Json | null> {
    const url = `${this.opts.baseUrl}/api_publica_${sigla}/_search`;
    try {
      let source: Json | null = null;
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        const { data } = await this.buscar(url, numero);
        source = data?.hits?.hits?.[0]?._source ?? null;
        if (source) return source;
        if (tentativa === 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
      return null;
    } catch (err) {
      throw this.mapearErro(err, sigla);
    }
  }

  private buscar(url: string, numero: string) {
    return axios.post(
      url,
      { query: { match: { numeroProcesso: numero } } },
      {
        headers: {
          Authorization: `APIKey ${this.opts.token}`,
          "Content-Type": "application/json",
        },
        timeout: this.opts.timeoutMs,
      }
    );
  }

  private mapearErro(err: unknown, sigla: string): ApiError {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        return new ApiError(
          502,
          "DATAJUD_AUTH",
          "Falha de autenticação no DataJud. Verifique DATAJUD_TOKEN no arquivo .env."
        );
      }
      if (status === 404) {
        return new ApiError(
          422,
          "TRIBUNAL_NAO_SUPORTADO",
          `O tribunal "${sigla.toUpperCase()}" não está disponível na API do DataJud.`
        );
      }
      if (err.code === "ECONNABORTED") {
        return new ApiError(
          504,
          "DATAJUD_TIMEOUT",
          "O DataJud demorou para responder. Tente novamente em instantes."
        );
      }
    }
    return new ApiError(
      502,
      "DATAJUD_INDISPONIVEL",
      "A API do DataJud está indisponível no momento. Tente novamente em instantes."
    );
  }
}
