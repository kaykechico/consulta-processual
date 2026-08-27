import type { Tribunal } from "@consulta/shared";
import {
  formatCNJ,
  parseDataJudDate,
  classificarMovimento,
  ProcessoSchema,
  type Processo,
} from "@consulta/shared";
import type { DataJudProcessoRaw } from "./datajud.schemas";

const GRAUS: Record<string, string> = {
  G1: "1º Grau",
  G2: "2º Grau",
  JE: "Juizado Especial",
  TR: "Tribunal",
};

function numeroOpcional(valor: unknown): number | undefined {
  if (valor == null || valor === "") return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : undefined;
}

export function normalizarProcesso(
  bruto: DataJudProcessoRaw,
  numero: string,
  tribunal: Tribunal
): Processo {
  const movimentos = (bruto.movimentos ?? [])
    .map((m) => {
      const cod = numeroOpcional(m.codigo);
      const orgaoJulgador = m.orgaoJulgador?.nome
        ? {
            codigo: numeroOpcional(m.orgaoJulgador.codigo),
            nome: m.orgaoJulgador.nome,
            codigoMunicipioIBGE: numeroOpcional(m.orgaoJulgador.codigoMunicipioIBGE),
          }
        : undefined;

      return {
        codigo: cod,
        nome: m.nome ?? "",
        dataHora: parseDataJudDate(m.dataHora),
        complementos: (m.complementosTabelados ?? [])
          .map((c) => c.nome ?? "")
          .filter((nome) => Boolean(nome)),
        orgaoJulgador,
      };
    })
    .filter((m) => m.nome || m.dataHora);

  const ordenados = [...movimentos].sort((a, b) => {
    const ta = a.dataHora ? Date.parse(a.dataHora) : -Infinity;
    const tb = b.dataHora ? Date.parse(b.dataHora) : -Infinity;
    return tb - ta;
  });

  const primeira = ordenados[0];
  const ultimaMovimentacao = primeira
    ? {
        nome: primeira.nome,
        dataHora: primeira.dataHora,
        codigo: primeira.codigo,
        categoria: classificarMovimento(primeira),
      }
    : undefined;

  const grau = bruto.grau ?? undefined;
  const datasRelevantes: { rotulo: string; valor: string }[] = [];
  const ajuizamento = parseDataJudDate(bruto.dataAjuizamento);
  if (ajuizamento) datasRelevantes.push({ rotulo: "Ajuizamento", valor: ajuizamento });
  const atualizacao = parseDataJudDate(bruto.dataHoraUltimaAtualizacao);
  if (atualizacao) datasRelevantes.push({ rotulo: "Última atualização", valor: atualizacao });

  const valorBruto = bruto.valorCausa ?? bruto.valor;
  const valorCausa = numeroOpcional(valorBruto);

  const partes = (bruto.partes ?? []).map((p) => {
    const nome = p.nome && p.nome.trim() ? p.nome.trim() : "Parte não identificada";
    const tipoParte = p.tipoParte ?? undefined;
    return {
      nome,
      tipoParte,
      tipoPessoa: p.tipoPessoa ?? undefined,
      isMinisterioPublico: /minist|^mp\b/i.test(`${tipoParte ?? ""} ${nome}`),
      advogados: (p.advogados ?? [])
        .map((a) => ({
          nome: a.nome ?? "",
          numeroOAB: a.numeroOAB != null && a.numeroOAB !== "" ? String(a.numeroOAB) : undefined,
        }))
        .filter((a) => a.nome),
      representantes: (p.representantes ?? [])
        .map((r) => ({ nome: r.nome ?? "" }))
        .filter((r) => r.nome),
    };
  });

  const assuntos = (bruto.assuntos ?? [])
    .filter((a) => a.nome)
    .map((a) => ({
      codigo: numeroOpcional(a.codigo),
      nome: a.nome!,
    }));

  const processo: Processo = {
    numeroProcesso: formatCNJ(numero),
    tribunal: bruto.tribunal ?? tribunal.nome,
    grau,
    instancia: grau ? (GRAUS[grau] ?? grau) : undefined,
    ultimaMovimentacao,
    valorCausa,
    dataAjuizamento: ajuizamento,
    dataHoraUltimaAtualizacao: atualizacao,
    classe: bruto.classe?.nome
      ? {
          codigo: numeroOpcional(bruto.classe.codigo),
          nome: bruto.classe.nome,
        }
      : undefined,
    assuntos,
    orgaoJulgador: bruto.orgaoJulgador?.nome
      ? {
          codigo: numeroOpcional(bruto.orgaoJulgador.codigo),
          nome: bruto.orgaoJulgador.nome,
          codigoMunicipioIBGE: numeroOpcional(bruto.orgaoJulgador.codigoMunicipioIBGE),
        }
      : undefined,
    competencia:
      typeof bruto.competencia === "string"
        ? bruto.competencia
        : (bruto.competencia?.nome ?? undefined),
    sistema: bruto.sistema?.nome
      ? {
          codigo: numeroOpcional(bruto.sistema.codigo),
          nome: bruto.sistema.nome,
        }
      : undefined,
    formato: bruto.formato?.nome
      ? {
          codigo: numeroOpcional(bruto.formato.codigo),
          nome: bruto.formato.nome,
        }
      : undefined,
    nivelSigilo: numeroOpcional(bruto.nivelSigilo),
    partes,
    movimentos: ordenados,
    datasRelevantes,
  };

  return ProcessoSchema.parse(processo);
}
