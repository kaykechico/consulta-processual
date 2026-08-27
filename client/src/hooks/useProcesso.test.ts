import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProcesso } from "./useProcesso";
import { buscarProcesso, ProcessoError } from "../services/api";
import type { Processo } from "@consulta/shared";

vi.mock("../services/api", () => ({
  buscarProcesso: vi.fn(),
  ProcessoError: class ProcessoError extends Error {
    constructor(
      public code: string,
      message: string
    ) {
      super(message);
      this.name = "ProcessoError";
    }
  },
}));

const mockProcesso: Processo = {
  numeroProcesso: "1009216-17.2023.8.26.0016",
  tribunal: "TJSP",
  grau: "G1",
  partes: [],
  movimentos: [],
  assuntos: [],
  datasRelevantes: [],
};

describe("useProcesso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia em estado idle", () => {
    const { result } = renderHook(() => useProcesso());
    expect(result.current.estado).toEqual({ tipo: "idle" });
  });

  it("executa busca com sucesso passando por carregando", async () => {
    let resolver: (p: Processo) => void;
    vi.mocked(buscarProcesso).mockReturnValue(
      new Promise<Processo>((resolve) => {
        resolver = resolve;
      })
    );

    const { result } = renderHook(() => useProcesso());

    act(() => {
      void result.current.buscar("10092161720238260016");
    });

    expect(result.current.estado).toEqual({ tipo: "carregando" });

    await act(async () => {
      resolver!(mockProcesso);
    });

    expect(result.current.estado).toEqual({ tipo: "sucesso", processo: mockProcesso });
  });

  it("transita para vazio quando processo não é encontrado", async () => {
    vi.mocked(buscarProcesso).mockRejectedValue(
      new ProcessoError("PROCESSO_NAO_ENCONTRADO", "Não encontrado")
    );

    const { result } = renderHook(() => useProcesso());

    await act(async () => {
      await result.current.buscar("10092161720238260016");
    });

    expect(result.current.estado).toEqual({ tipo: "vazio" });
  });

  it("transita para erro quando ocorre falha genérica ou de API", async () => {
    vi.mocked(buscarProcesso).mockRejectedValue(
      new ProcessoError("DATAJUD_INDISPONIVEL", "Serviço indisponível")
    );

    const { result } = renderHook(() => useProcesso());

    await act(async () => {
      await result.current.buscar("10092161720238260016");
    });

    expect(result.current.estado).toEqual({
      tipo: "erro",
      code: "DATAJUD_INDISPONIVEL",
      mensagem: "Serviço indisponível",
    });
  });

  it("trata erro não-ProcessoError genérico", async () => {
    vi.mocked(buscarProcesso).mockRejectedValue(new Error("Erro de rede"));

    const { result } = renderHook(() => useProcesso());

    await act(async () => {
      await result.current.buscar("10092161720238260016");
    });

    expect(result.current.estado).toEqual({
      tipo: "erro",
      code: "ERRO",
      mensagem: "Erro de rede",
    });
  });

  it("ignora resposta quando requisição é cancelada", async () => {
    vi.mocked(buscarProcesso).mockRejectedValue(
      new ProcessoError("CANCELADO", "Consulta cancelada.")
    );

    const { result } = renderHook(() => useProcesso());

    await act(async () => {
      await result.current.buscar("10092161720238260016");
    });

    expect(result.current.estado).toEqual({ tipo: "carregando" });
  });

  it("cancela requisição anterior e reseta estado ao chamar reset", async () => {
    const { result } = renderHook(() => useProcesso());

    act(() => {
      void result.current.buscar("10092161720238260016");
    });
    expect(result.current.estado).toEqual({ tipo: "carregando" });

    act(() => {
      result.current.reset();
    });
    expect(result.current.estado).toEqual({ tipo: "idle" });
  });
});
