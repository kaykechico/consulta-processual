import { describe, it, expect } from "vitest";
import { filtrarMovimentos, calcularContagens, isIntervaloInvalido } from "./movimentoFiltros";
import type { Movimento } from "@consulta/shared";

const mockMovimentos: Movimento[] = [
  {
    codigo: 26,
    nome: "Distribuição",
    dataHora: "2023-01-10T10:00:00.000Z",
    complementos: [],
  },
  {
    codigo: 3,
    nome: "Decisão interlocutória",
    dataHora: "2023-03-15T14:00:00.000Z",
    complementos: ["Urgente"],
  },
  {
    codigo: 193,
    nome: "Sentença homologatória",
    dataHora: "2023-06-20T16:00:00.000Z",
    complementos: [],
    orgaoJulgador: { nome: "2ª Vara Cível" },
  },
];

describe("filtrarMovimentos", () => {
  it("retorna todos ordenados por mais recente por padrão", () => {
    const res = filtrarMovimentos(mockMovimentos, {});
    expect(res).toHaveLength(3);
    expect(res[0].nome).toBe("Sentença homologatória");
    expect(res[2].nome).toBe("Distribuição");
  });

  it("ordena por mais antigos", () => {
    const res = filtrarMovimentos(mockMovimentos, { ordem: "antigo" });
    expect(res[0].nome).toBe("Distribuição");
    expect(res[2].nome).toBe("Sentença homologatória");
  });

  it("filtra por categoria", () => {
    const res = filtrarMovimentos(mockMovimentos, { categoria: "SENTENCA" });
    expect(res).toHaveLength(1);
    expect(res[0].nome).toBe("Sentença homologatória");
  });

  it("filtra por busca textual no nome, complementos e órgão", () => {
    const r1 = filtrarMovimentos(mockMovimentos, { busca: "urgente" });
    expect(r1).toHaveLength(1);
    expect(r1[0].nome).toBe("Decisão interlocutória");

    const r2 = filtrarMovimentos(mockMovimentos, { busca: "2ª Vara" });
    expect(r2).toHaveLength(1);
    expect(r2[0].nome).toBe("Sentença homologatória");
  });

  it("filtra por data início", () => {
    const res = filtrarMovimentos(mockMovimentos, { dataInicio: "2023-03-01" });
    expect(res).toHaveLength(2);
  });

  it("filtra por data fim", () => {
    const res = filtrarMovimentos(mockMovimentos, { dataFim: "2023-02-01" });
    expect(res).toHaveLength(1);
    expect(res[0].nome).toBe("Distribuição");
  });

  it("filtra por intervalo fechado", () => {
    const res = filtrarMovimentos(mockMovimentos, {
      dataInicio: "2023-02-01",
      dataFim: "2023-05-01",
    });
    expect(res).toHaveLength(1);
    expect(res[0].nome).toBe("Decisão interlocutória");
  });

  it("retorna vazio para intervalo sem correspondência", () => {
    const res = filtrarMovimentos(mockMovimentos, {
      dataInicio: "2024-01-01",
      dataFim: "2024-12-31",
    });
    expect(res).toHaveLength(0);
  });

  it("tolera datas inválidas sem quebrar", () => {
    const res = filtrarMovimentos(mockMovimentos, { dataInicio: "invalido", dataFim: "" });
    expect(res).toHaveLength(3);
  });

  it("retorna vazio quando data início é posterior a data fim", () => {
    const res = filtrarMovimentos(mockMovimentos, {
      dataInicio: "2023-12-01",
      dataFim: "2023-01-01",
    });
    expect(res).toHaveLength(0);
  });

  it("tolera movimentos com complementos ou nome indefinidos na busca", () => {
    const incompletos = [
      { nome: "Movimento Normal", dataHora: "2023-01-01T00:00:00.000Z", complementos: [] },
      { nome: "", dataHora: "2023-01-02T00:00:00.000Z", complementos: ["doc"] },
    ];
    const res = filtrarMovimentos(incompletos as Movimento[], { busca: "doc" });
    expect(res).toHaveLength(1);
    expect(res[0].complementos).toEqual(["doc"]);
  });
});

describe("calcularContagens", () => {
  it("calcula contagens por categoria corretamente", () => {
    const contagens = calcularContagens(mockMovimentos);
    expect(contagens.DISTRIBUICAO).toBe(1);
    expect(contagens.DECISAO).toBe(1);
    expect(contagens.SENTENCA).toBe(1);
    expect(contagens.AUDIENCIA).toBe(0);
  });
});

describe("isIntervaloInvalido", () => {
  it("retorna true quando data inicial é maior que data final", () => {
    expect(isIntervaloInvalido("2023-05-10", "2023-05-01")).toBe(true);
    expect(isIntervaloInvalido("10/05/2023", "01/05/2023")).toBe(true);
  });

  it("retorna false quando data inicial é menor ou igual a data final", () => {
    expect(isIntervaloInvalido("2023-05-01", "2023-05-10")).toBe(false);
    expect(isIntervaloInvalido("2023-05-01", "2023-05-01")).toBe(false);
  });

  it("retorna false quando alguma das datas não foi informada ou é inválida", () => {
    expect(isIntervaloInvalido("2023-05-01", "")).toBe(false);
    expect(isIntervaloInvalido("", "2023-05-10")).toBe(false);
    expect(isIntervaloInvalido("invalido", "2023-05-10")).toBe(false);
  });
});
