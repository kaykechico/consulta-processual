import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentes } from "./useRecentes";

const CHAVE = "consulta-processual:recentes";
const CHAVE_OPT = "consulta-processual:recentes:enabled";

describe("useRecentes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inicia com lista vazia e enabled true por padrão", () => {
    const { result } = renderHook(() => useRecentes());
    expect(result.current.recentes).toEqual([]);
    expect(result.current.enabled).toBe(true);
  });

  it("adiciona item aos recentes e persiste no localStorage", () => {
    const { result } = renderHook(() => useRecentes());

    act(() => {
      result.current.adicionar("10092161720238260016", "TJSP - Procedimento Comum");
    });

    expect(result.current.recentes).toHaveLength(1);
    expect(result.current.recentes[0].numero).toBe("10092161720238260016");
    expect(result.current.recentes[0].rotulo).toBe("TJSP - Procedimento Comum");
    expect(result.current.recentes[0].ts).toBeDefined();

    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
    expect(salvo).toHaveLength(1);
    expect(salvo[0].numero).toBe("10092161720238260016");
  });

  it("move item duplicado para o início ao adicionar novamente", () => {
    const { result } = renderHook(() => useRecentes());

    act(() => {
      result.current.adicionar("111", "Processo 1");
      result.current.adicionar("222", "Processo 2");
      result.current.adicionar("111", "Processo 1 Atualizado");
    });

    expect(result.current.recentes).toHaveLength(2);
    expect(result.current.recentes[0].numero).toBe("111");
    expect(result.current.recentes[0].rotulo).toBe("Processo 1 Atualizado");
    expect(result.current.recentes[1].numero).toBe("222");
  });

  it("limita quantidade máxima a 20 itens", () => {
    const { result } = renderHook(() => useRecentes());

    act(() => {
      for (let i = 1; i <= 25; i++) {
        result.current.adicionar(`proc-${i}`, `Rotulo ${i}`);
      }
    });

    expect(result.current.recentes).toHaveLength(20);
    expect(result.current.recentes[0].numero).toBe("proc-25");
    expect(result.current.recentes[19].numero).toBe("proc-6");
  });

  it("remove item específico", () => {
    const { result } = renderHook(() => useRecentes());

    act(() => {
      result.current.adicionar("111", "Processo 1");
      result.current.adicionar("222", "Processo 2");
    });

    act(() => {
      result.current.remover("111");
    });

    expect(result.current.recentes).toHaveLength(1);
    expect(result.current.recentes[0].numero).toBe("222");
  });

  it("limpa todos os itens", () => {
    const { result } = renderHook(() => useRecentes());

    act(() => {
      result.current.adicionar("111", "Processo 1");
      result.current.adicionar("222", "Processo 2");
    });

    act(() => {
      result.current.limpar();
    });

    expect(result.current.recentes).toEqual([]);
  });

  it("desabilita e limpa histórico quando setEnabled(false)", () => {
    const { result } = renderHook(() => useRecentes());

    act(() => {
      result.current.adicionar("111", "Processo 1");
    });
    expect(result.current.recentes).toHaveLength(1);

    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.enabled).toBe(false);
    expect(result.current.recentes).toEqual([]);
    expect(localStorage.getItem(CHAVE_OPT)).toBe("false");

    act(() => {
      result.current.adicionar("222", "Processo 2");
    });
    expect(result.current.recentes).toEqual([]);
  });

  it("carrega histórico salvo existente no localStorage ignorando expirados", () => {
    const agora = Date.now();
    const expirado = agora - 31 * 24 * 60 * 60 * 1000;
    const valido = agora - 1000;

    localStorage.setItem(
      CHAVE,
      JSON.stringify([
        { numero: "expirado", rotulo: "Exp", ts: expirado },
        { numero: "valido", rotulo: "Val", ts: valido },
      ])
    );

    const { result } = renderHook(() => useRecentes());
    expect(result.current.recentes).toHaveLength(1);
    expect(result.current.recentes[0].numero).toBe("valido");
  });

  it("tolera entradas corrompidas ou nulas no localStorage sem lançar exceção", () => {
    localStorage.setItem(
      CHAVE,
      JSON.stringify([null, 123, "string", { numero: 1 }, { numero: "valido", rotulo: "Rotulo" }])
    );
    const { result } = renderHook(() => useRecentes());
    expect(result.current.recentes).toHaveLength(1);
    expect(result.current.recentes[0].numero).toBe("valido");
  });
});
