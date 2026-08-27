import { useCallback, useEffect, useState } from "react";

export interface Recente {
  numero: string;
  rotulo: string;
  ts?: number;
}

const CHAVE = "consulta-processual:recentes";
const CHAVE_OPT = "consulta-processual:recentes:enabled";
const MAX_RECENTES = 20;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function carregar(): Recente[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return [];
    const dados = JSON.parse(raw);
    if (!Array.isArray(dados)) return [];
    const agora = Date.now();
    const filtrados = (dados as Recente[]).filter(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof r.numero === "string" &&
        typeof r.rotulo === "string" &&
        (!r.ts || agora - r.ts < TTL_MS)
    );
    return filtrados.map((r) => (r.ts ? r : { ...r, ts: agora }));
  } catch {
    return [];
  }
}

function carregarEnabled(): boolean {
  try {
    const v = localStorage.getItem(CHAVE_OPT);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
}

export function useRecentes() {
  const [recentes, setRecentes] = useState<Recente[]>(carregar);
  const [enabled, setEnabledRaw] = useState<boolean>(carregarEnabled);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(recentes));
    } catch {
      try {
        localStorage.removeItem(CHAVE);
        localStorage.setItem(CHAVE, JSON.stringify(recentes.slice(0, 5)));
      } catch {
        void 0;
      }
    }
  }, [recentes]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_OPT, String(enabled));
    } catch {
      void 0;
    }
  }, [enabled]);

  const adicionar = useCallback(
    (numero: string, rotulo: string) => {
      if (!enabled) return;
      setRecentes((prev) =>
        [{ numero, rotulo, ts: Date.now() }, ...prev.filter((r) => r.numero !== numero)].slice(
          0,
          MAX_RECENTES
        )
      );
    },
    [enabled]
  );

  const remover = useCallback((numero: string) => {
    setRecentes((prev) => prev.filter((r) => r.numero !== numero));
  }, []);

  const limpar = useCallback(() => setRecentes([]), []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledRaw(v);
    if (!v) setRecentes([]);
  }, []);

  return { recentes, adicionar, remover, limpar, enabled, setEnabled };
}
