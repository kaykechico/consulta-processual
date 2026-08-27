import { describe, it, expect } from "vitest";
import { selecionarMelhorHit } from "./datajud.selector";
import type { DataJudProcessoRaw } from "./datajud.schemas";

describe("selecionarMelhorHit", () => {
  const CNJ_ALVO = "10092161720238260016";

  it("retorna null para lista vazia de hits", () => {
    expect(selecionarMelhorHit([], CNJ_ALVO)).toBeNull();
  });

  it("retorna o único hit correspondente", () => {
    const hit: DataJudProcessoRaw = {
      numeroProcesso: CNJ_ALVO,
      tribunal: "TJSP",
    };
    const resultado = selecionarMelhorHit([{ _source: hit }], CNJ_ALVO);
    expect(resultado).toEqual(hit);
  });

  it("retorna null se nenhum hit corresponder ao CNJ buscado", () => {
    const hitInvalido: DataJudProcessoRaw = {
      numeroProcesso: "00000000000000000000",
      tribunal: "TJSP",
    };
    expect(selecionarMelhorHit([{ _source: hitInvalido }], CNJ_ALVO)).toBeNull();
  });

  it("ignora primeiro hit incorreto e escolhe o correspondente exato", () => {
    const hitIncorreto: DataJudProcessoRaw = {
      numeroProcesso: "99999999920238260016",
      tribunal: "TJSP",
      dataHoraUltimaAtualizacao: "2024-01-01T00:00:00Z",
    };
    const hitCorreto: DataJudProcessoRaw = {
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      dataHoraUltimaAtualizacao: "2023-08-25T10:00:00Z",
    };
    const resultado = selecionarMelhorHit(
      [{ _source: hitIncorreto }, { _source: hitCorreto }],
      CNJ_ALVO
    );
    expect(resultado).toEqual(hitCorreto);
  });

  it("seleciona o hit com a data de atualização mais recente entre múltiplos hits válidos", () => {
    const hitAntigo: DataJudProcessoRaw = {
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      dataHoraUltimaAtualizacao: "2023-01-01T00:00:00Z",
      movimentos: [{ nome: "Inicial" }],
    };
    const hitRecente: DataJudProcessoRaw = {
      numeroProcesso: "10092161720238260016",
      tribunal: "TJSP",
      dataHoraUltimaAtualizacao: "2023-08-25T10:00:00Z",
      movimentos: [{ nome: "Inicial" }, { nome: "Despacho" }],
    };
    const resultado = selecionarMelhorHit(
      [{ _source: hitAntigo }, { _source: hitRecente }],
      CNJ_ALVO
    );
    expect(resultado).toEqual(hitRecente);
  });

  it("desempata por volume de movimentos se datas forem iguais", () => {
    const hitMenosMovs: DataJudProcessoRaw = {
      numeroProcesso: CNJ_ALVO,
      tribunal: "TJSP",
      dataHoraUltimaAtualizacao: "2023-08-25T10:00:00Z",
      movimentos: [{ nome: "Inicial" }],
    };
    const hitMaisMovs: DataJudProcessoRaw = {
      numeroProcesso: CNJ_ALVO,
      tribunal: "TJSP",
      dataHoraUltimaAtualizacao: "2023-08-25T10:00:00Z",
      movimentos: [{ nome: "Inicial" }, { nome: "Audiência" }, { nome: "Sentença" }],
    };
    const resultado = selecionarMelhorHit(
      [{ _source: hitMenosMovs }, { _source: hitMaisMovs }],
      CNJ_ALVO
    );
    expect(resultado).toEqual(hitMaisMovs);
  });

  it("desempata por dataAjuizamento mais recente se atualizacao e movimentos forem identicos", () => {
    const hitG1: DataJudProcessoRaw = {
      numeroProcesso: CNJ_ALVO,
      tribunal: "TJSP",
      grau: "G1",
      dataHoraUltimaAtualizacao: "2023-08-25T10:00:00Z",
      dataAjuizamento: "2023-01-10T00:00:00Z",
      movimentos: [{ nome: "Inicial" }],
    };
    const hitG2: DataJudProcessoRaw = {
      numeroProcesso: CNJ_ALVO,
      tribunal: "TJSP",
      grau: "G2",
      dataHoraUltimaAtualizacao: "2023-08-25T10:00:00Z",
      dataAjuizamento: "2023-05-20T00:00:00Z",
      movimentos: [{ nome: "Recurso" }],
    };
    const resultado = selecionarMelhorHit([{ _source: hitG1 }, { _source: hitG2 }], CNJ_ALVO);
    expect(resultado).toEqual(hitG2);
  });
});
