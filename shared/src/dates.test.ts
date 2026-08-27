import { describe, it, expect } from "vitest";
import { parseDataJudDate } from "./dates";

describe("parseDataJudDate", () => {
  it("converte data compacta AAAAMMDD", () => {
    const iso = parseDataJudDate("20230824");
    expect(iso).toBeDefined();
    expect(new Date(iso!).toISOString()).toBe(iso);
    expect(iso).toBe("2023-08-24T00:00:00.000Z");
  });

  it("converte data compacta com hora", () => {
    expect(parseDataJudDate("20230824153000")).toBe("2023-08-24T15:30:00.000Z");
    expect(parseDataJudDate("2023082415")).toBe("2023-08-24T15:00:00.000Z");
  });

  it("converte ISO date", () => {
    expect(parseDataJudDate("2023-08-24")).toBe("2023-08-24T00:00:00.000Z");
  });

  it("converte ISO datetime com Z e com fuso", () => {
    expect(parseDataJudDate("2023-08-24T15:30:00Z")).toBe("2023-08-24T15:30:00.000Z");
    expect(parseDataJudDate("2023-08-24T15:30:00.123Z")).toBeDefined();
    expect(parseDataJudDate("2023-08-24T15:30:00+03:00")).toBeDefined();
  });

  it("converte ISO sem fuso adicionando Z", () => {
    const iso = parseDataJudDate("2023-08-24T15:30:00");
    expect(iso).toBe("2023-08-24T15:30:00.000Z");
  });

  it("retorna undefined para inválidos", () => {
    expect(parseDataJudDate("")).toBeUndefined();
    expect(parseDataJudDate("   ")).toBeUndefined();
    expect(parseDataJudDate(null as unknown as string)).toBeUndefined();
    expect(parseDataJudDate(123 as unknown as string)).toBeUndefined();
    expect(parseDataJudDate("20231340")).toBeUndefined();
    expect(parseDataJudDate("not-a-date")).toBeUndefined();
    expect(parseDataJudDate("2023-13-01")).toBeUndefined();
  });

  it("valida hora/min/seg limites", () => {
    expect(parseDataJudDate("20230824235959")).toBe("2023-08-24T23:59:59.000Z");
    expect(parseDataJudDate("20230824240000")).toBeUndefined();
  });

  it("converte SQL datetime com espaço e fuso sem dois pontos", () => {
    expect(parseDataJudDate("2023-08-24 15:30:00")).toBe("2023-08-24T15:30:00.000Z");
    expect(parseDataJudDate("2023-08-24 15:30:00.000")).toBe("2023-08-24T15:30:00.000Z");
    expect(parseDataJudDate("2023-08-24T15:30:00+0300")).toBe("2023-08-24T12:30:00.000Z");
    expect(parseDataJudDate("2023-08-24 15:30:00-0300")).toBe("2023-08-24T18:30:00.000Z");
  });

  it("trim espaços", () => {
    expect(parseDataJudDate(" 2023-08-24 ")).toBe("2023-08-24T00:00:00.000Z");
  });

  it("valida calendário com round-trip e bissextos", () => {
    expect(parseDataJudDate("2024-02-29")).toBe("2024-02-29T00:00:00.000Z");
    expect(parseDataJudDate("20240229")).toBe("2024-02-29T00:00:00.000Z");
    expect(parseDataJudDate("2025-02-29")).toBeUndefined();
    expect(parseDataJudDate("20250229")).toBeUndefined();
    expect(parseDataJudDate("2025-02-31")).toBeUndefined();
    expect(parseDataJudDate("20250231")).toBeUndefined();
    expect(parseDataJudDate("2025-04-31")).toBeUndefined();
    expect(parseDataJudDate("20250431")).toBeUndefined();
    expect(parseDataJudDate("2025-13-01")).toBeUndefined();
    expect(parseDataJudDate("2025-00-10")).toBeUndefined();
    expect(parseDataJudDate("2025-05-00")).toBeUndefined();
    expect(parseDataJudDate("2025-05-10T24:00:00Z")).toBeUndefined();
    expect(parseDataJudDate("2025-05-10T23:60:00Z")).toBeUndefined();
    expect(parseDataJudDate("2025-05-10T23:59:60Z")).toBeUndefined();
  });
});
