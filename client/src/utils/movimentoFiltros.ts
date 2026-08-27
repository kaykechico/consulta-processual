import type { Movimento, CategoriaMovimento } from "@consulta/shared";
import { classificarMovimento } from "@consulta/shared";

export interface FiltrosMovimento {
  categoria?: CategoriaMovimento | "TODOS";
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  ordem?: "recente" | "antigo";
}

export function parseDataFiltro(valor?: string): number | null {
  if (!valor || !valor.trim()) return null;
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const ts = Date.parse(`${v}T00:00:00.000Z`);
    return Number.isNaN(ts) ? null : ts;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [dia, mes, ano] = v.split("/");
    const ts = Date.parse(`${ano}-${mes}-${dia}T00:00:00.000Z`);
    return Number.isNaN(ts) ? null : ts;
  }
  const ts = Date.parse(v);
  return Number.isNaN(ts) ? null : ts;
}

export function isIntervaloInvalido(dataInicio?: string, dataFim?: string): boolean {
  const inicioTs = parseDataFiltro(dataInicio);
  const fimTs = parseDataFiltro(dataFim);
  if (inicioTs !== null && fimTs !== null) {
    return inicioTs > fimTs;
  }
  return false;
}

export function filtrarMovimentos(movimentos: Movimento[], filtros: FiltrosMovimento): Movimento[] {
  let lista = [...movimentos];

  if (filtros.categoria && filtros.categoria !== "TODOS") {
    lista = lista.filter((m) => classificarMovimento(m) === filtros.categoria);
  }

  if (filtros.busca && filtros.busca.trim()) {
    const q = filtros.busca.toLowerCase().trim();
    lista = lista.filter((m) => {
      const nome = m.nome ?? "";
      const matchesNome = nome.toLowerCase().includes(q);
      const matchesComp = (m.complementos ?? []).some(
        (c) => c && typeof c === "string" && c.toLowerCase().includes(q)
      );
      const matchesOrgao = Boolean(
        m.orgaoJulgador?.nome && m.orgaoJulgador.nome.toLowerCase().includes(q)
      );
      return matchesNome || matchesComp || matchesOrgao;
    });
  }

  const inicioTs = parseDataFiltro(filtros.dataInicio);
  const fimTs = parseDataFiltro(filtros.dataFim);

  if (inicioTs !== null) {
    lista = lista.filter((m) => {
      if (!m.dataHora) return false;
      const ts = Date.parse(m.dataHora);
      return !Number.isNaN(ts) && ts >= inicioTs;
    });
  }

  if (fimTs !== null) {
    const fimAjustado = fimTs + 24 * 60 * 60 * 1000 - 1;
    lista = lista.filter((m) => {
      if (!m.dataHora) return false;
      const ts = Date.parse(m.dataHora);
      return !Number.isNaN(ts) && ts <= fimAjustado;
    });
  }

  const ordem = filtros.ordem ?? "recente";
  lista.sort((a, b) => {
    const ta = a.dataHora ? Date.parse(a.dataHora) : 0;
    const tb = b.dataHora ? Date.parse(b.dataHora) : 0;
    return ordem === "recente" ? tb - ta : ta - tb;
  });

  return lista;
}

export function calcularContagens(movimentos: Movimento[]): Record<CategoriaMovimento, number> {
  const contagens: Record<CategoriaMovimento, number> = {
    AUDIENCIA: 0,
    SENTENCA: 0,
    DECISAO: 0,
    RECURSO: 0,
    DOCUMENTO: 0,
    INTIMACAO: 0,
    DISTRIBUICAO: 0,
    OUTROS: 0,
  };

  for (const m of movimentos) {
    const cat = classificarMovimento(m);
    contagens[cat] = (contagens[cat] ?? 0) + 1;
  }

  return contagens;
}
