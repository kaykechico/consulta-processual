import { describe, it, expect } from "vitest";
import { ProcessoSchema, ApiSuccessSchema, ApiErrorSchema } from "./schemas";

describe("schemas", () => {
  it("ProcessoSchema valida processo mínimo", () => {
    const parsed = ProcessoSchema.safeParse({
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      partes: [],
      movimentos: [],
      assuntos: [],
      datasRelevantes: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("ProcessoSchema valida processo completo", () => {
    const parsed = ProcessoSchema.safeParse({
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      grau: "G1",
      instancia: "1º Grau",
      ultimaMovimentacao: {
        nome: "Conclusão",
        dataHora: "2023-08-24T15:30:00.000Z",
        categoria: "DECISAO",
      },
      valorCausa: 1000,
      dataAjuizamento: "2023-08-24T00:00:00.000Z",
      classe: { nome: "Procedimento Comum" },
      assuntos: [{ nome: "Direito Civil" }],
      orgaoJulgador: { nome: "1ª Vara" },
      partes: [{ nome: "João", isMinisterioPublico: false, advogados: [], representantes: [] }],
      movimentos: [
        { nome: "Distribuição", dataHora: "2023-08-24T10:00:00.000Z", complementos: [] },
      ],
      datasRelevantes: [{ rotulo: "Ajuizamento", valor: "2023-08-24T00:00:00.000Z" }],
    });
    expect(parsed.success).toBe(true);
  });

  it("ProcessoSchema rejeita sem numeroProcesso", () => {
    const parsed = ProcessoSchema.safeParse({
      tribunal: "TJSP",
      partes: [],
      movimentos: [],
      assuntos: [],
      datasRelevantes: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("ApiSuccessSchema valida wrapper", () => {
    const ok = ApiSuccessSchema.safeParse({
      processo: {
        numeroProcesso: "1009216-17.2023.8.26.0016",
        tribunal: "TJSP",
        partes: [],
        movimentos: [],
        assuntos: [],
        datasRelevantes: [],
      },
    });
    expect(ok.success).toBe(true);
  });

  it("ApiErrorSchema valida erro", () => {
    const err = ApiErrorSchema.safeParse({
      error: { code: "CNJ_INVALIDO", message: "inválido" },
    });
    expect(err.success).toBe(true);
  });

  it("ApiErrorSchema aceita requestId opcional", () => {
    const err = ApiErrorSchema.safeParse({
      error: { code: "ERRO", message: "msg", requestId: "abc-123" },
    });
    expect(err.success).toBe(true);
  });
});
