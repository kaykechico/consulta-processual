import { ApiError } from "../utils/errors";
import { formatarCNJ, validarCNJ } from "../utils/cnj";
import { siglaDataJud } from "../utils/tribunal";
import { env } from "../config/env";
import { DataJudCliente } from "./datajud.client";

type Json = Record<string, any>;

export interface NomeCodigoDTO {
  codigo?: number;
  nome: string;
}

export interface OrgaoJulgadorDTO {
  codigo?: number;
  nome: string;
  codigoMunicipioIBGE?: number;
}

export interface ParteDTO {
  nome: string;
  tipoParte?: string;
  tipoPessoa?: string;
  documento?: string;
  isMinisterioPublico: boolean;
  advogados?: { nome: string; numeroOAB?: string }[];
  representantes?: { nome: string }[];
}

export interface MovimentoDTO {
  dataHora?: string;
  nome: string;
  complementos?: string[];
}

export interface DataRelevanteDTO {
  rotulo: string;
  valor: string;
}

export interface ProcessoDTO {
  numeroProcesso: string;
  tribunal: string;
  grau?: string;
  instancia?: string;
  situacao?: string;
  valorCausa?: number;
  dataAjuizamento?: string;
  dataHoraUltimaAtualizacao?: string;
  classe?: NomeCodigoDTO;
  assuntos?: NomeCodigoDTO[];
  orgaoJulgador?: OrgaoJulgadorDTO;
  competencia?: string;
  sistema?: NomeCodigoDTO;
  formato?: NomeCodigoDTO;
  nivelSigilo?: number;
  partes?: ParteDTO[];
  movimentos?: MovimentoDTO[];
  datasRelevantes?: DataRelevanteDTO[];
}

const GRAUS: Record<string, string> = {
  G1: "1º Grau",
  G2: "2º Grau",
  JE: "Juizado Especial",
  TR: "Tribunal",
};

function nomeCodigo(obj: Json | undefined): NomeCodigoDTO | undefined {
  if (!obj || typeof obj.nome !== "string") return undefined;
  return { codigo: obj.codigo, nome: obj.nome };
}

function normalizarParte(p: Json): ParteDTO {
  const advogados = (p.advogados ?? [])
    .map((a: Json) => ({ nome: a.nome, numeroOAB: a.numeroOAB }))
    .filter((a: { nome: string }) => a.nome);
  const representantes = (p.representantes ?? [])
    .map((r: Json) => ({ nome: r.nome }))
    .filter((r: { nome: string }) => r.nome);
  const tipoParte = p.tipoParte;
  const nome = p.nome;
  const isMinisterioPublico = /minist|^mp\b/i.test(`${tipoParte ?? ""} ${nome ?? ""}`);
  return {
    nome: nome ?? "Parte não identificada",
    tipoParte,
    tipoPessoa: p.tipoPessoa,
    documento: p.documento,
    isMinisterioPublico,
    advogados,
    representantes,
  };
}

const RE_DATAJUD_COMPACTA = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/;

function normalizarData(v: unknown): string | undefined {
  if (typeof v !== "string" || !v) return undefined;
  const m = v.match(RE_DATAJUD_COMPACTA);
  if (m) {
    const [, ano, mes, dia, hora, min, seg] = m;
    return `${ano}-${mes}-${dia}T${hora ?? "00"}:${min ?? "00"}:${seg ?? "00"}.000Z`;
  }
  return v;
}

function normalizarMovimento(m: Json): MovimentoDTO {
  return {
    dataHora: normalizarData(m.dataHora),
    nome: m.nome,
    complementos: (m.complementosTabelados ?? [])
      .map((c: Json) => c.nome)
      .filter((c: string) => c),
  };
}

function normalizarProcesso(bruto: Json, numero: string): ProcessoDTO {
  const movimentos: MovimentoDTO[] = (bruto.movimentos ?? [])
    .map(normalizarMovimento)
    .filter((m: MovimentoDTO) => m.nome || m.dataHora);
  const comData = movimentos
    .filter((m) => m.dataHora)
    .sort(
      (a, b) => new Date(b.dataHora as string).getTime() - new Date(a.dataHora as string).getTime()
    );
  const semData = movimentos.filter((m) => !m.dataHora);

  const grau = bruto.grau;
  const datasRelevantes: DataRelevanteDTO[] = [];
  const ajuizamento = normalizarData(bruto.dataAjuizamento);
  if (ajuizamento) datasRelevantes.push({ rotulo: "Ajuizamento", valor: ajuizamento });
  const atualizacao = normalizarData(bruto.dataHoraUltimaAtualizacao);
  if (atualizacao) {
    datasRelevantes.push({ rotulo: "Última atualização", valor: atualizacao });
  }

  const valorBruto = bruto.valorCausa ?? bruto.valor;
  const valorCausa = Number.isFinite(Number(valorBruto)) ? Number(valorBruto) : undefined;

  return {
    numeroProcesso: formatarCNJ(bruto.numeroProcesso ?? numero),
    tribunal: bruto.tribunal ?? "",
    grau,
    instancia: grau ? GRAUS[grau] ?? grau : undefined,
    situacao: comData[0]?.nome,
    valorCausa,
    dataAjuizamento: ajuizamento,
    dataHoraUltimaAtualizacao: atualizacao,
    classe: nomeCodigo(bruto.classe),
    assuntos: (bruto.assuntos ?? [])
      .map(nomeCodigo)
      .filter((a: NomeCodigoDTO | undefined) => a) as NomeCodigoDTO[],
    orgaoJulgador: bruto.orgaoJulgador?.nome
      ? {
          codigo: bruto.orgaoJulgador.codigo,
          nome: bruto.orgaoJulgador.nome,
          codigoMunicipioIBGE: bruto.orgaoJulgador.codigoMunicipioIBGE,
        }
      : undefined,
    competencia: bruto.competencia?.nome ?? bruto.competencia,
    sistema: nomeCodigo(bruto.sistema),
    formato: nomeCodigo(bruto.formato),
    nivelSigilo: bruto.nivelSigilo,
    partes: (bruto.partes ?? []).map(normalizarParte),
    movimentos: [...comData, ...semData],
    datasRelevantes,
  };
}

export class ProcessoService {
  private readonly cache = new Map<string, { criadoEm: number; valor: ProcessoDTO | null }>();

  constructor(
    private readonly cliente: DataJudCliente,
    private readonly ttlMs: number
  ) {}

  async buscar(numero: string): Promise<ProcessoDTO | null> {
    if (!validarCNJ(numero)) {
      throw new ApiError(422, "CNJ_INVALIDO", "Número de CNJ inválido. Verifique e tente novamente.");
    }
    const sigla = siglaDataJud(numero);
    if (!sigla) {
      throw new ApiError(
        422,
        "TRIBUNAL_NAO_SUPORTADO",
        "O tribunal deste número CNJ não é suportado pela API do DataJud."
      );
    }

    const agora = Date.now();
    const hit = this.cache.get(numero);
    if (hit && agora - hit.criadoEm < this.ttlMs) return hit.valor;

    const bruto = await this.cliente.buscarProcesso(sigla, numero);
    const valor = bruto ? normalizarProcesso(bruto, numero) : null;
    this.cache.set(numero, { criadoEm: agora, valor });
    return valor;
  }
}

export const processoService = new ProcessoService(
  new DataJudCliente({
    baseUrl: env.DATAJUD_BASE_URL,
    token: env.DATAJUD_TOKEN,
    timeoutMs: env.DATAJUD_TIMEOUT_MS,
  }),
  env.CACHE_TTL_SECONDS * 1000
);
