import { z } from "zod";

const OpcionalNullable = <T extends z.ZodTypeAny>(schema: T) => schema.optional().nullable();

const DataJudCodigo = z.object({
  codigo: OpcionalNullable(z.number()),
  nome: z.string(),
});

const DataJudComplementoTabelado = z.object({
  nome: OpcionalNullable(z.string()),
});

export const DataJudMovimentoSchema = z.object({
  dataHora: OpcionalNullable(z.string()),
  nome: OpcionalNullable(z.string()),
  codigo: OpcionalNullable(z.number()),
  complementosTabelados: z.array(DataJudComplementoTabelado).optional(),
});

export const DataJudAdvogadoSchema = z.object({
  nome: OpcionalNullable(z.string()),
  numeroOAB: OpcionalNullable(z.string()),
});

export const DataJudParteSchema = z.object({
  nome: OpcionalNullable(z.string()),
  tipoParte: OpcionalNullable(z.string()),
  tipoPessoa: OpcionalNullable(z.string()),
  documento: OpcionalNullable(z.string()),
  advogados: z.array(DataJudAdvogadoSchema).optional(),
  representantes: z.array(DataJudComplementoTabelado).optional(),
});

export const DataJudProcessoRawSchema = z
  .object({
    numeroProcesso: OpcionalNullable(z.string()),
    tribunal: OpcionalNullable(z.string()),
    grau: OpcionalNullable(z.string()),
    valorCausa: z.unknown().optional(),
    valor: z.unknown().optional(),
    dataAjuizamento: OpcionalNullable(z.string()),
    dataHoraUltimaAtualizacao: OpcionalNullable(z.string()),
    classe: DataJudCodigo.optional(),
    assuntos: z.array(DataJudCodigo).optional(),
    orgaoJulgador: z
      .object({
        codigo: OpcionalNullable(z.number()),
        nome: z.string(),
        codigoMunicipioIBGE: OpcionalNullable(z.number()),
      })
      .optional(),
    competencia: z
      .union([z.string(), z.object({ nome: z.string() })])
      .optional()
      .nullable(),
    sistema: DataJudCodigo.optional(),
    formato: DataJudCodigo.optional(),
    nivelSigilo: OpcionalNullable(z.number()),
    partes: z.array(DataJudParteSchema).optional(),
    movimentos: z.array(DataJudMovimentoSchema).optional(),
  })
  .passthrough()
  .refine(
    (src) =>
      src.numeroProcesso != null ||
      src.tribunal != null ||
      src.movimentos != null ||
      src.partes != null ||
      src.classe != null,
    "estrutura mínima de processo ausente"
  );

export const DataJudResponseSchema = z.object({
  hits: z.object({
    hits: z.array(
      z.object({
        _source: DataJudProcessoRawSchema,
      })
    ),
  }),
});

export type DataJudProcessoRaw = z.infer<typeof DataJudProcessoRawSchema>;
