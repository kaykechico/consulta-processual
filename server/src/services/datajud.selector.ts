import { normalizeCNJ } from "@consulta/shared";
import type { DataJudProcessoRaw } from "./datajud.schemas";

export function selecionarMelhorHit(
  hits: Array<{ _source: DataJudProcessoRaw }>,
  numeroBuscado: string
): DataJudProcessoRaw | null {
  if (!Array.isArray(hits) || hits.length === 0) return null;

  const normalizadoAlvo = normalizeCNJ(numeroBuscado);
  const correspondentes = hits
    .map((h) => h._source)
    .filter((src) => src && normalizeCNJ(src.numeroProcesso ?? "") === normalizadoAlvo);

  if (correspondentes.length === 0) return null;
  if (correspondentes.length === 1) return correspondentes[0] ?? null;

  const ordenados = [...correspondentes].sort((a, b) => {
    const dataA = a.dataHoraUltimaAtualizacao ? Date.parse(a.dataHoraUltimaAtualizacao) : 0;
    const dataB = b.dataHoraUltimaAtualizacao ? Date.parse(b.dataHoraUltimaAtualizacao) : 0;
    if (dataB !== dataA) return dataB - dataA;

    const movsA = a.movimentos?.length ?? 0;
    const movsB = b.movimentos?.length ?? 0;
    if (movsB !== movsA) return movsB - movsA;

    const ajuizamentoA = a.dataAjuizamento ? Date.parse(a.dataAjuizamento) : 0;
    const ajuizamentoB = b.dataAjuizamento ? Date.parse(b.dataAjuizamento) : 0;
    return ajuizamentoB - ajuizamentoA;
  });

  return ordenados[0] ?? null;
}
