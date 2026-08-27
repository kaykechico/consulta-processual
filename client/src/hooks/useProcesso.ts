import { useCallback, useEffect, useRef, useState } from "react";
import { buscarProcesso, ProcessoError } from "../services/api";
import type { Processo } from "@consulta/shared";

export type EstadoConsulta =
  | { tipo: "idle" }
  | { tipo: "carregando" }
  | { tipo: "erro"; code: string; mensagem: string }
  | { tipo: "vazio" }
  | { tipo: "sucesso"; processo: Processo };

export function useProcesso() {
  const [estado, setEstado] = useState<EstadoConsulta>({ tipo: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const buscar = useCallback(async (numero: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setEstado({ tipo: "carregando" });
    try {
      const processo = await buscarProcesso(numero, controller.signal);
      setEstado({ tipo: "sucesso", processo });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      if (error instanceof ProcessoError && error.code === "CANCELADO") {
        return;
      }
      if (error instanceof ProcessoError && error.code === "PROCESSO_NAO_ENCONTRADO") {
        setEstado({ tipo: "vazio" });
        return;
      }
      setEstado({
        tipo: "erro",
        code: error instanceof ProcessoError ? error.code : "ERRO",
        mensagem: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      });
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setEstado({ tipo: "idle" });
  }, []);

  return { estado, buscar, reset };
}
