import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { normalizarProcesso } from "./processo.normalizer";
import { getTribunalByAlias } from "@consulta/shared";
import type { DataJudProcessoRaw } from "./datajud.schemas";

function carregarFixture(nome: string): DataJudProcessoRaw {
  const caminho = join(__dirname, "..", "fixtures", "datajud", `${nome}.json`);
  return JSON.parse(readFileSync(caminho, "utf-8")) as DataJudProcessoRaw;
}

describe("ProcessoNormalizer com Fixtures Reais", () => {
  it("normaliza fixture TJSP com sucesso", () => {
    const raw = carregarFixture("tjsp");
    const tribunal = getTribunalByAlias("tjsp")!;
    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);

    expect(p.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
    expect(p.tribunal).toBe("TJSP");
    expect(p.grau).toBe("G1");
    expect(p.instancia).toBe("1º Grau");
    expect(p.valorCausa).toBe(5000.5);
    expect(p.partes).toHaveLength(2);
    expect(p.partes[0].advogados[0].numeroOAB).toBe("123456SP");
    expect(p.movimentos).toHaveLength(3);
    expect(p.ultimaMovimentacao?.categoria).toBe("SENTENCA");
    expect(p.ultimaMovimentacao?.nome).toBe("Julgado procedente o pedido");
  });

  it("normaliza fixture TRF1 com sucesso", () => {
    const raw = carregarFixture("trf1");
    const tribunal = getTribunalByAlias("trf1")!;
    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);

    expect(p.tribunal).toBe("TRF1");
    expect(p.instancia).toBe("2º Grau");
    expect(p.valorCausa).toBe(150000);
    expect(p.partes[0].tipoParte).toBe("Impetrante");
    expect(p.movimentos).toHaveLength(2);
    expect(p.ultimaMovimentacao?.categoria).toBe("DECISAO");
  });

  it("normaliza fixture TRT2 com sucesso", () => {
    const raw = carregarFixture("trt2");
    const tribunal = getTribunalByAlias("trt2")!;
    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);

    expect(p.tribunal).toBe("TRT2");
    expect(p.valorCausa).toBe(45000);
    expect(p.partes[0].tipoParte).toBe("Reclamante");
    expect(p.movimentos).toHaveLength(3);
    expect(p.ultimaMovimentacao?.categoria).toBe("SENTENCA");
  });

  it("normaliza fixture TRE-DFT com sucesso", () => {
    const raw = carregarFixture("tre-dft");
    const tribunal = getTribunalByAlias("tre-dft")!;
    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);

    expect(p.tribunal).toBe("TRE-DFT");
    expect(p.partes[1].isMinisterioPublico).toBe(true);
    expect(p.movimentos).toHaveLength(2);
    expect(p.ultimaMovimentacao?.categoria).toBe("SENTENCA");
  });

  it("normaliza fixture TJMMG com sucesso", () => {
    const raw = carregarFixture("tjmmg");
    const tribunal = {
      segmento: "9",
      codigo: "13",
      alias: "tjmmg",
      nome: "Tribunal de Justiça Militar de Minas Gerais",
      justica: "militar" as const,
    };
    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);

    expect(p.tribunal).toBe("TJMMG");
    expect(p.partes[0].isMinisterioPublico).toBe(true);
    expect(p.movimentos).toHaveLength(2);
  });

  it("tolera dados ausentes, nulos ou campos malformados defensivamente", () => {
    const tribunal = getTribunalByAlias("tjsp")!;
    const raw: DataJudProcessoRaw = {
      numeroProcesso: "10092161720238260016",
      classe: { nome: "" },
      movimentos: [
        { nome: "", dataHora: "data-invalida" },
        { nome: "Movimento Valido", dataHora: "2024-01-01T00:00:00.000Z" },
      ],
      partes: [
        {
          nome: "",
          advogados: [{ nome: "", numeroOAB: null as unknown as string }],
        },
      ],
    };

    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);
    expect(p.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
    expect(p.partes[0].nome).toBe("Parte não identificada");
    expect(p.partes[0].advogados).toHaveLength(0);
    expect(p.movimentos).toHaveLength(1);
    expect(p.movimentos[0].nome).toBe("Movimento Valido");
  });

  it("normaliza orgaoJulgador de movimentação quando presente", () => {
    const tribunal = getTribunalByAlias("tjsp")!;
    const raw: DataJudProcessoRaw = {
      numeroProcesso: "10092161720238260016",
      movimentos: [
        {
          codigo: 193,
          nome: "Sentença proferida",
          dataHora: "2024-05-10T14:30:00.000Z",
          orgaoJulgador: {
            codigo: 1234,
            nome: "3ª Vara Cível",
            codigoMunicipioIBGE: 3550308,
          },
        },
      ],
    };

    const p = normalizarProcesso(raw, raw.numeroProcesso!, tribunal);
    expect(p.movimentos[0].orgaoJulgador?.nome).toBe("3ª Vara Cível");
    expect(p.movimentos[0].orgaoJulgador?.codigo).toBe(1234);
  });
});
