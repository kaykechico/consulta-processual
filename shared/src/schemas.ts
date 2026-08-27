import { z } from "zod";

export const AdvogadoSchema = z.object({
  nome: z.string(),
  numeroOAB: z.string().optional(),
});
export type Advogado = z.infer<typeof AdvogadoSchema>;

export const RepresentanteSchema = z.object({
  nome: z.string(),
});
export type Representante = z.infer<typeof RepresentanteSchema>;

export const ParteSchema = z.object({
  nome: z.string(),
  tipoParte: z.string().optional(),
  tipoPessoa: z.string().optional(),
  isMinisterioPublico: z.boolean(),
  advogados: z.array(AdvogadoSchema).default([]),
  representantes: z.array(RepresentanteSchema).default([]),
});
export type Parte = z.infer<typeof ParteSchema>;

export const AssuntoSchema = z.object({
  codigo: z.number().optional(),
  nome: z.string(),
});
export type Assunto = z.infer<typeof AssuntoSchema>;

export const OrgaoJulgadorSchema = z.object({
  codigo: z.number().optional(),
  nome: z.string(),
  codigoMunicipioIBGE: z.number().optional(),
});
export type OrgaoJulgador = z.infer<typeof OrgaoJulgadorSchema>;

export const MovimentoSchema = z.object({
  codigo: z.number().optional(),
  nome: z.string(),
  dataHora: z.string().optional(),
  complementos: z.array(z.string()).default([]),
  orgaoJulgador: OrgaoJulgadorSchema.optional(),
});
export type Movimento = z.infer<typeof MovimentoSchema>;

export const DataRelevanteSchema = z.object({
  rotulo: z.string(),
  valor: z.string().optional(),
});
export type DataRelevante = z.infer<typeof DataRelevanteSchema>;

export const UltimaMovimentacaoSchema = z.object({
  nome: z.string(),
  dataHora: z.string().optional(),
  codigo: z.number().optional(),
  categoria: z.string().optional(),
});
export type UltimaMovimentacao = z.infer<typeof UltimaMovimentacaoSchema>;

export const NomeCodigoSchema = z.object({
  codigo: z.number().optional(),
  nome: z.string(),
});
export type NomeCodigo = z.infer<typeof NomeCodigoSchema>;

export const ProcessoSchema = z.object({
  numeroProcesso: z.string(),
  tribunal: z.string(),
  grau: z.string().optional(),
  instancia: z.string().optional(),
  ultimaMovimentacao: UltimaMovimentacaoSchema.optional(),
  valorCausa: z.number().optional(),
  dataAjuizamento: z.string().optional(),
  dataHoraUltimaAtualizacao: z.string().optional(),
  classe: NomeCodigoSchema.optional(),
  assuntos: z.array(AssuntoSchema).default([]),
  orgaoJulgador: OrgaoJulgadorSchema.optional(),
  competencia: z.string().optional(),
  sistema: NomeCodigoSchema.optional(),
  formato: NomeCodigoSchema.optional(),
  nivelSigilo: z.number().optional(),
  partes: z.array(ParteSchema).default([]),
  movimentos: z.array(MovimentoSchema).default([]),
  datasRelevantes: z.array(DataRelevanteSchema).default([]),
});
export type Processo = z.infer<typeof ProcessoSchema>;

export const ApiSuccessSchema = z.object({
  processo: ProcessoSchema,
});
export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const API_ERROR_CODES = {
  CNJ_INVALIDO: "CNJ_INVALIDO",
  NUMERO_OBRIGATORIO: "NUMERO_OBRIGATORIO",
  JSON_INVALIDO: "JSON_INVALIDO",
  TRIBUNAL_NAO_SUPORTADO: "TRIBUNAL_NAO_SUPORTADO",
  PROCESSO_NAO_ENCONTRADO: "PROCESSO_NAO_ENCONTRADO",
  PROCESSO_SIGILOSO: "PROCESSO_SIGILOSO",
  DATAJUD_TIMEOUT: "DATAJUD_TIMEOUT",
  DATAJUD_RATE_LIMITED: "DATAJUD_RATE_LIMITED",
  DATAJUD_INDISPONIVEL: "DATAJUD_INDISPONIVEL",
  DATAJUD_AUTH: "DATAJUD_AUTH",
  DATAJUD_SCHEMA_INVALID: "DATAJUD_SCHEMA_INVALID",
  RATE_LIMITED: "RATE_LIMITED",
  ROTA_NAO_ENCONTRADA: "ROTA_NAO_ENCONTRADA",
  ERRO_INTERNO: "ERRO_INTERNO",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
