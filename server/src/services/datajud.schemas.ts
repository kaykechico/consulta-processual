import { z } from "zod";

const OpcionalNullable = <T extends z.ZodTypeAny>(schema: T) => schema.optional().nullable();

const DataJudCodigo = z.object({
  codigo: OpcionalNullable(z.union([z.number(), z.string()])),
  nome: OpcionalNullable(z.string()),
});

const DataJudComplementoTabelado = z.object({
  nome: OpcionalNullable(z.string()),
});

export const DataJudMovimentoSchema = z.object({
  dataHora: OpcionalNullable(z.string()),
  nome: OpcionalNullable(z.string()),
  codigo: OpcionalNullable(z.union([z.number(), z.string()])),
  complementosTabelados: z.array(DataJudComplementoTabelado).optional(),
  orgaoJulgador: OpcionalNullable(
    z.object({
      codigo: OpcionalNullable(z.union([z.number(), z.string()])),
      nome: OpcionalNullable(z.string()),
      codigoMunicipioIBGE: OpcionalNullable(z.union([z.number(), z.string()])),
    })
  ),
});

export const DataJudAdvogadoSchema = z.object({
  nome: OpcionalNullable(z.string()),
  numeroOAB: OpcionalNullable(z.union([z.string(), z.number()])),
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
    classe: OpcionalNullable(DataJudCodigo),
    assuntos: OpcionalNullable(z.array(DataJudCodigo)),
    orgaoJulgador: OpcionalNullable(
      z.object({
        codigo: OpcionalNullable(z.union([z.number(), z.string()])),
        nome: OpcionalNullable(z.string()),
        codigoMunicipioIBGE: OpcionalNullable(z.union([z.number(), z.string()])),
      })
    ),
    competencia: z
      .union([z.string(), z.object({ nome: OpcionalNullable(z.string()) })])
      .optional()
      .nullable(),
    sistema: OpcionalNullable(DataJudCodigo),
    formato: OpcionalNullable(DataJudCodigo),
    nivelSigilo: OpcionalNullable(z.union([z.number(), z.string()])),
    segredoJustica: OpcionalNullable(z.union([z.boolean(), z.string(), z.number()])),
    sigiloso: OpcionalNullable(z.union([z.boolean(), z.string(), z.number()])),
    grauSigilo: OpcionalNullable(z.union([z.number(), z.string()])),
    partes: OpcionalNullable(z.array(DataJudParteSchema)),
    movimentos: OpcionalNullable(z.array(DataJudMovimentoSchema)),
  })
  .strip()
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
