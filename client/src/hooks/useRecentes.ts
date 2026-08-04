import { useCallback, useEffect, useState } from "react";

export interface Recente {
  numero: string;
  rotulo: string;
}

const CHAVE = "consulta-processual:recentes";
const MAX_RECENTES = 10;

function carregar(): Recente[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return [];
    const dados = JSON.parse(raw);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export function useRecentes() {
  const [recentes, setRecentes] = useState<Recente[]>(carregar);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(recentes));
  }, [recentes]);

  const adicionar = useCallback((numero: string, rotulo: string) => {
    setRecentes((prev) => [
      { numero, rotulo },
      ...prev.filter((r) => r.numero !== numero),
    ].slice(0, MAX_RECENTES));
  }, []);

  const remover = useCallback((numero: string) => {
    setRecentes((prev) => prev.filter((r) => r.numero !== numero));
  }, []);

  const limpar = useCallback(() => setRecentes([]), []);

  return { recentes, adicionar, remover, limpar };
}