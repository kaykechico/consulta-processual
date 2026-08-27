import { describe, it, expect } from "vitest";
import { formatarMascara } from "./mascara";
import { extrairCNJ, validateCNJ } from "@consulta/shared";

describe("mascara", () => {
  it("formatarMascara formata 20 dígitos", () => {
    expect(formatarMascara("10092161720238260016")).toBe("1009216-17.2023.8.26.0016");
    expect(formatarMascara("1009216172023826001")).toBe("1009216-17.2023.8.26.001");
  });
  it("formatarMascara lida com vazio e curto", () => {
    expect(formatarMascara("")).toBe("");
    expect(formatarMascara("123")).toBe("123");
  });
  it("extrairCNJ extrai de texto com máscara", () => {
    expect(extrairCNJ("Processo nº 1009216-17.2023.8.26.0016 relevante")).toBe(
      "10092161720238260016"
    );
  });
  it("extrairCNJ extrai 20 dígitos contínuos", () => {
    expect(extrairCNJ("veja 10092161720238260016 aqui")).toBe("10092161720238260016");
  });
  it("extrairCNJ retorna null se não há CNJ", () => {
    expect(extrairCNJ("sem número")).toBeNull();
    expect(extrairCNJ("123")).toBeNull();
  });
  it("validateCNJ rejeita com DV errado", () => {
    expect(validateCNJ("10092161720238260015")).toBe(false);
  });

  it("normaliza parâmetros de URL com ou sem máscara", () => {
    const comMascara = "1009216-17.2023.8.26.0016";
    const semMascara = "10092161720238260016";
    expect(extrairCNJ(comMascara)).toBe(semMascara);
    expect(extrairCNJ(semMascara)).toBe(semMascara);
  });

  it("trata valores nulos e não-string com segurança", () => {
    expect(formatarMascara(null as never)).toBe("");
    expect(formatarMascara(undefined as never)).toBe("");
  });
});
