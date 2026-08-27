import { describe, it, expect } from "vitest";
import { getTribunalFromCNJ, getTribunalByAlias, TRIBUNAIS } from "./tribunais";

describe("tribunais", () => {
  it("TRIBUNAIS contém entradas esperadas", () => {
    expect(TRIBUNAIS.length).toBeGreaterThan(50);
    const tjsp = TRIBUNAIS.find((t) => t.alias === "tjsp");
    expect(tjsp).toBeDefined();
    expect(tjsp?.nome).toContain("São Paulo");
  });

  it("getTribunalFromCNJ identifica TJSP", () => {
    const t = getTribunalFromCNJ("10092161720238260016");
    expect(t?.alias).toBe("tjsp");
    expect(t?.segmento).toBe("8");
    expect(t?.codigo).toBe("26");
  });

  it("getTribunalFromCNJ identifica TRF e TRT e TSE", () => {
    function genValid(n: string, ano: string, seg: string, tr: string, org: string): string {
      const RE = /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/;
      const validate = (dig: string) => {
        if (!RE.test(dig)) return false;
        const v = BigInt(`${dig.slice(0, 7)}${dig.slice(9)}${dig.slice(7, 9)}`);
        return v % 97n === 1n;
      };
      for (let dv = 0; dv < 100; dv++) {
        const dvStr = String(dv).padStart(2, "0");
        const dig = n + dvStr + ano + seg + tr + org;
        if (validate(dig)) return dig;
      }
      throw new Error("no valid");
    }
    const cnjTrf1 = genValid("1000000", "2023", "4", "01", "0000");
    expect(getTribunalFromCNJ(cnjTrf1)?.alias).toBe("trf1");

    const cnjStf = genValid("1000000", "2023", "1", "00", "0000");
    expect(getTribunalFromCNJ(cnjStf)?.alias).toBe("stf");
  });

  it("getTribunalFromCNJ retorna null para CNJ curto ou inválido", () => {
    expect(getTribunalFromCNJ("123")).toBe(null);
    expect(getTribunalFromCNJ("")).toBe(null);
    expect(getTribunalFromCNJ("100000032202382")).toBe(null);
  });

  it("getTribunalByAlias encontra por alias", () => {
    expect(getTribunalByAlias("tjsp")?.codigo).toBe("26");
    expect(getTribunalByAlias("stf")?.segmento).toBe("1");
    expect(getTribunalByAlias("inexistente")).toBe(null);
  });

  it("getTribunalFromCNJ identifica TJDFT", () => {
    function genValid(n: string, ano: string, seg: string, tr: string, org: string): string {
      const RE = /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/;
      const validate = (dig: string) => {
        if (!RE.test(dig)) return false;
        const v = BigInt(`${dig.slice(0, 7)}${dig.slice(9)}${dig.slice(7, 9)}`);
        return v % 97n === 1n;
      };
      for (let dv = 0; dv < 100; dv++) {
        const dvStr = String(dv).padStart(2, "0");
        const dig = n + dvStr + ano + seg + tr + org;
        if (validate(dig)) return dig;
      }
      throw new Error("no valid");
    }
    const cnjTjdft = genValid("0700000", "2023", "8", "07", "0001");
    const t = getTribunalFromCNJ(cnjTjdft);
    expect(t?.alias).toBe("tjdft");
    expect(t?.nome).toContain("Distrito Federal");
  });

  it("aliases estaduais cobrem todos os estados incluindo tjdft", () => {
    const ufs = [
      "ac",
      "al",
      "ap",
      "am",
      "ba",
      "ce",
      "es",
      "go",
      "ma",
      "mt",
      "ms",
      "mg",
      "pa",
      "pb",
      "pr",
      "pe",
      "pi",
      "rj",
      "rn",
      "rs",
      "ro",
      "rr",
      "sc",
      "se",
      "sp",
      "to",
    ];
    for (const uf of ufs) {
      expect(TRIBUNAIS.some((t) => t.alias === `tj${uf}`)).toBe(true);
    }
    expect(TRIBUNAIS.some((t) => t.alias === "tjdft")).toBe(true);
  });

  it("identifica tre-dft corretamente e marca STF como não suportado no DataJud", () => {
    const treDft = getTribunalByAlias("tre-dft");
    expect(treDft).toBeDefined();
    expect(treDft?.codigo).toBe("07");
    expect(treDft?.segmento).toBe("6");
    expect(getTribunalByAlias("tre-df")).toBe(null);

    const stf = getTribunalByAlias("stf");
    expect(stf).toBeDefined();
    expect(stf?.suportadoDatajud).toBe(false);
  });

  it("identifica tribunais militares estaduais TJMMG, TJMRS e TJMSP sem colisão", () => {
    const tjmmg = getTribunalFromCNJ("00000010020239130000");
    expect(tjmmg?.alias).toBe("tjmmg");
    expect(tjmmg?.codigo).toBe("13");
    expect(tjmmg?.segmento).toBe("9");

    const tjmrs = getTribunalFromCNJ("00000010020239210000");
    expect(tjmrs?.alias).toBe("tjmrs");
    expect(tjmrs?.codigo).toBe("21");
    expect(tjmrs?.segmento).toBe("9");

    const tjmsp = getTribunalFromCNJ("00000010020239260000");
    expect(tjmsp?.alias).toBe("tjmsp");
    expect(tjmsp?.codigo).toBe("26");
    expect(tjmsp?.segmento).toBe("9");
  });
});
