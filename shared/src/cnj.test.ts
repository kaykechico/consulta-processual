import { describe, it, expect } from "vitest";
import {
  apenasDigitos,
  normalizeCNJ,
  formatCNJ,
  validateCNJ,
  getCNJSegment,
  getCNJTribunalCode,
} from "./cnj";

describe("cnj", () => {
  it("apenasDigitos remove máscara", () => {
    expect(apenasDigitos("1009216-17.2023.8.26.0016")).toBe("10092161720238260016");
    expect(apenasDigitos("  1009216 17 2023 8 26 0016  ")).toBe("10092161720238260016");
  });

  it("normalizeCNJ alias para apenasDigitos", () => {
    expect(normalizeCNJ("1009216-17.2023.8.26.0016")).toBe("10092161720238260016");
  });

  it("formatCNJ formata número válido", () => {
    expect(formatCNJ("10092161720238260016")).toBe("1009216-17.2023.8.26.0016");
    expect(formatCNJ("1009216-17.2023.8.26.0016")).toBe("1009216-17.2023.8.26.0016");
  });

  it("formatCNJ retorna input se inválido", () => {
    expect(formatCNJ("123")).toBe("123");
    expect(formatCNJ("abc")).toBe("abc");
  });

  it("validateCNJ aceita números válidos", () => {
    expect(validateCNJ("10092161720238260016")).toBe(true);
    expect(validateCNJ("1009216-17.2023.8.26.0016")).toBe(true);

    expect(validateCNJ("10000003220238260016")).toBe(true);
    expect(validateCNJ("00012343720258260100")).toBe(true);
  });

  it("validateCNJ rejeita números inválidos", () => {
    expect(validateCNJ("10092161720238260015")).toBe(false);
    expect(validateCNJ("00000000000000000000")).toBe(false);
    expect(validateCNJ("123")).toBe(false);
    expect(validateCNJ("")).toBe(false);
    expect(validateCNJ("abcdefghijklmnopqrst")).toBe(false);
  });

  it("validateCNJ aceita com/sem máscara e espaços", () => {
    expect(validateCNJ(" 1009216-17.2023.8.26.0016 ")).toBe(true);
    expect(validateCNJ("10092161720238260016")).toBe(true);
  });

  it("getCNJSegment extrai segmento", () => {
    expect(getCNJSegment("10092161720238260016")).toBe("8");
    expect(getCNJSegment("1009216-17.2023.8.26.0016")).toBe("8");
    expect(getCNJSegment("123")).toBe(null);
    expect(getCNJSegment("")).toBe(null);
  });

  it("getCNJTribunalCode extrai código do tribunal", () => {
    expect(getCNJTribunalCode("10092161720238260016")).toBe("26");
    expect(getCNJTribunalCode("10000003220238260016")).toBe("26");
    expect(getCNJTribunalCode("123")).toBe(null);
  });

  it("validateCNJ rejeita tamanhos incorretos e caracteres intercalados", () => {
    expect(validateCNJ("1009216172023826001")).toBe(false);
    expect(validateCNJ("100921617202382600160")).toBe(false);
    expect(validateCNJ("1009216-17.2023.8.26.0016-EXTRA")).toBe(false);
  });

  it("trata tipos não-string e valores nulos com segurança", () => {
    expect(apenasDigitos(null as never)).toBe("");
    expect(apenasDigitos(undefined as never)).toBe("");
    expect(formatCNJ(null as never)).toBe("");
    expect(validateCNJ(null as never)).toBe(false);
    expect(validateCNJ(undefined as never)).toBe(false);
  });
});
