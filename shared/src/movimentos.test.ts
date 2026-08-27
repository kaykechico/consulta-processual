import { describe, it, expect } from "vitest";
import { classificarMovimento } from "./movimentos";

describe("classificarMovimento", () => {
  it("classifica distribuição", () => {
    expect(classificarMovimento({ nome: "Distribuição por sorteio" })).toBe("DISTRIBUICAO");
    expect(classificarMovimento({ nome: "Redistribuição por prevenção" })).toBe("DISTRIBUICAO");
  });
  it("classifica sentença", () => {
    expect(classificarMovimento({ nome: "Sentença proferida" })).toBe("SENTENCA");
    expect(classificarMovimento({ nome: "Trânsito em julgado" })).toBe("SENTENCA");
  });
  it("classifica recurso", () => {
    expect(classificarMovimento({ nome: "Recurso de apelação" })).toBe("RECURSO");
    expect(classificarMovimento({ nome: "Embargos de declaração" })).toBe("RECURSO");
    expect(classificarMovimento({ nome: "Agravo de instrumento" })).toBe("RECURSO");
  });
  it("classifica audiência", () => {
    expect(classificarMovimento({ nome: "Audiência de conciliação designada" })).toBe("AUDIENCIA");
    expect(classificarMovimento({ nome: "Julgamento em sessão" })).toBe("AUDIENCIA");
  });
  it("classifica intimação", () => {
    expect(classificarMovimento({ nome: "Intimação expedida" })).toBe("INTIMACAO");
    expect(classificarMovimento({ nome: "Publicação no Diário" })).toBe("INTIMACAO");
  });
  it("classifica decisão", () => {
    expect(classificarMovimento({ nome: "Decisão interlocutória" })).toBe("DECISAO");
    expect(classificarMovimento({ nome: "Despacho proferido" })).toBe("DECISAO");
    expect(classificarMovimento({ nome: "Liminar deferida" })).toBe("DECISAO");
  });
  it("classifica documento", () => {
    expect(classificarMovimento({ nome: "Juntada de petição" })).toBe("DOCUMENTO");
    expect(classificarMovimento({ nome: "Certidão expedida" })).toBe("DOCUMENTO");
    expect(classificarMovimento({ nome: "Mandado expedido" })).toBe("DOCUMENTO");
  });
  it("retorna OUTROS quando não casa", () => {
    expect(classificarMovimento({ nome: "Movimento genérico sem categoria" })).toBe("OUTROS");
    expect(classificarMovimento({ nome: "" })).toBe("OUTROS");
  });
  it("prioriza primeira regra (distribuição antes de sentença)", () => {
    expect(classificarMovimento({ nome: "Distribuição e sentença" })).toBe("DISTRIBUICAO");
  });

  it("classifica por código oficial CNJ prioritariamente sobre o texto", () => {
    expect(classificarMovimento({ codigo: 193, nome: "Texto qualquer" })).toBe("SENTENCA");
    expect(classificarMovimento({ codigo: 3, nome: "Outro texto" })).toBe("DECISAO");
    expect(classificarMovimento({ codigo: 9, nome: "Aviso" })).toBe("AUDIENCIA");
    expect(classificarMovimento({ codigo: 110, nome: "Movimento" })).toBe("RECURSO");
    expect(classificarMovimento({ codigo: 60, nome: "Comunicação" })).toBe("INTIMACAO");
    expect(classificarMovimento({ codigo: 85, nome: "Anexo" })).toBe("DOCUMENTO");
    expect(classificarMovimento({ codigo: 26, nome: "Processo" })).toBe("DISTRIBUICAO");
    expect(classificarMovimento({ codigo: 99999, nome: "Despacho proferido" })).toBe("DECISAO");
  });
});
