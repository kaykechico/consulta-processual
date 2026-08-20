import { ApiError } from "../utils/errors";
import { LruCache } from "../lib/cache";
import { RequestCoalescer } from "../lib/coalescer";
import { env } from "../config/env";
import { DataJudClient } from "./datajud.client";
import type { DataJudProcessoRaw } from "./datajud.schemas";
import { normalizeCNJ, validateCNJ, formatCNJ } from "../../../shared/src/cnj.js";
import { getTribunalFromCNJ, type Tribunal } from "../../../shared/src/tribunais.js";
import { parseDataJudDate } from "../../../shared/src/dates.js";
import { classificarMovimento } from "../../../shared/src/movimentos.js";
import { ProcessoSchema, API_ERROR_CODES, type Processo } from "../../../shared/src/schemas.js";

const GRAUS: Record<string, string> = {
  G1: "1º Grau",
  G2: "2º Grau",
  JE: "Juizado Especial",
  TR: "Tribunal",
};

export interface ProcessoServiceOptions {
  ttlMs: number;
  negativeTtlMs: number;
  maxEntries: number;
}

export class ProcessoService {
  private readonly cache: LruCache<string, Processo | null>;
  private readonly coalescer = new RequestCoalescer<string, Processo | null>();

  constructor(
    private readonly cliente: DataJudClient,
    private readonly opts: ProcessoServiceOptions
  ) {
    this.cache = new LruCache(opts.maxEntries);
  }

  async buscar(input: string): Promise<Processo | null> {
    const numero = normalizeCNJ(input);
    if (!validateCNJ(numero)) {
      throw new ApiError(
        422,
        API_ERROR_CODES.CNJ_INVALIDO,
        "Número de CNJ inválido. Verifique e tente novamente."
      );
    }

    const tribunal = getTribunalFromCNJ(numero);
    if (!tribunal) {
      throw new ApiError(
        422,
        API_ERROR_CODES.TRIBUNAL_NAO_SUPORTADO,
        "O tribunal deste número CNJ não é suportado pelo serviço de dados processuais."
      );
    }

    const hit = this.cache.get(numero);
    if (hit !== undefined) {
      return hit;
    }

    const resultado = await this.coalescer.run(numero, () =>
      this.consultarDataJud(numero, tribunal)
    );
    this.cache.set(numero, resultado, resultado ? this.opts.ttlMs : this.opts.negativeTtlMs);
    return resultado;
  }

  private async consultarDataJud(numero: string, tribunal: Tribunal): Promise<Processo | null> {
    const bruto = await this.cliente.buscarProcesso(tribunal.alias, numero);
    if (!bruto) return null;
    return normalizarProcesso(bruto, numero, tribunal);
  }
}

function normalizarProcesso(
  bruto: DataJudProcessoRaw,
  numero: string,
  tribunal: Tribunal
): Processo {
  const movimentos = (bruto.movimentos ?? [])
    .map((m) => ({
      codigo: m.codigo ?? undefined,
      nome: m.nome ?? "",
      dataHora: parseDataJudDate(m.dataHora),
      complementos: (m.complementosTabelados ?? []).map((c) => c.nome ?? "").filter((nome) => nome),
    }))
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
  const valorCausa = Number.isFinite(Number(valorBruto)) ? Number(valorBruto) : undefined;

  const partes = (bruto.partes ?? []).map((p) => {
    const nome = p.nome ?? "Parte não identificada";
    const tipoParte = p.tipoParte ?? undefined;
    return {
      nome,
      tipoParte,
      tipoPessoa: p.tipoPessoa ?? undefined,
      isMinisterioPublico: /minist|^mp\b/i.test(`${tipoParte ?? ""} ${nome}`),
      advogados: (p.advogados ?? [])
        .map((a) => ({ nome: a.nome ?? "", numeroOAB: a.numeroOAB ?? undefined }))
        .filter((a) => a.nome),
      representantes: (p.representantes ?? [])
        .map((r) => ({ nome: r.nome ?? "" }))
        .filter((r) => r.nome),
    };
  });

  const assuntos = (bruto.assuntos ?? [])
    .filter((a) => a.nome)
    .map((a) => ({ codigo: a.codigo ?? undefined, nome: a.nome }));

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
      ? { codigo: bruto.classe.codigo ?? undefined, nome: bruto.classe.nome }
      : undefined,
    assuntos,
    orgaoJulgador: bruto.orgaoJulgador?.nome
      ? {
          codigo: bruto.orgaoJulgador.codigo ?? undefined,
          nome: bruto.orgaoJulgador.nome,
          codigoMunicipioIBGE: bruto.orgaoJulgador.codigoMunicipioIBGE ?? undefined,
        }
      : undefined,
    competencia:
      typeof bruto.competencia === "string" ? bruto.competencia : bruto.competencia?.nome,
    sistema: bruto.sistema?.nome
      ? { codigo: bruto.sistema.codigo ?? undefined, nome: bruto.sistema.nome }
      : undefined,
    formato: bruto.formato?.nome
      ? { codigo: bruto.formato.codigo ?? undefined, nome: bruto.formato.nome }
      : undefined,
    nivelSigilo: bruto.nivelSigilo ?? undefined,
    partes,
    movimentos: ordenados,
    datasRelevantes,
  };

  return ProcessoSchema.parse(processo);
}

export const processoService = new ProcessoService(
  new DataJudClient({
    baseUrl: env.DATAJUD_BASE_URL,
    token: env.DATAJUD_TOKEN,
    timeoutMs: env.DATAJUD_TIMEOUT_MS,
    maxRetries: env.DATAJUD_MAX_RETRIES,
    retryBaseMs: env.DATAJUD_RETRY_BASE_MS,
  }),
  {
    ttlMs: env.CACHE_TTL_SECONDS * 1000,
    negativeTtlMs: env.CACHE_NEGATIVE_TTL_SECONDS * 1000,
    maxEntries: env.CACHE_MAX_ENTRIES,
  }
);
