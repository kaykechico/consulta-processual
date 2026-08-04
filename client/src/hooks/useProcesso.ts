import { useCallback, useState } from "react";
import { buscarProcesso, ProcessoError } from "../services/api";
import type { ProcessoDTO } from "../types/processo";

export type EstadoConsulta =
  | { tipo: "idle" }
  | { tipo: "carregando" }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "vazio" }
  | { tipo: "sucesso"; processo: ProcessoDTO };

export function useProcesso() {
  const [estado, setEstado] = useState<EstadoConsulta>({ tipo: "idle" });

  const buscar = useCallback(async (numero: string) => {
    setEstado({ tipo: "carregando" });
    try {
      const processo = await buscarProcesso(numero);
      setEstado({ tipo: "sucesso", processo });
    } catch (error) {
      if (error instanceof ProcessoError && error.code === "NAO_ENCONTRADO") {
        setEstado({ tipo: "vazio" });
        return;
      }
      setEstado({
        tipo: "erro",
        mensagem:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      });
    }
  }, []);

  const reset = useCallback(() => setEstado({ tipo: "idle" }), []);

  return { estado, buscar, reset };
}