import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProcessoService } from "./processo.service";
import { DataJudClient } from "./datajud.client";
import { API_ERROR_CODES } from "@consulta/shared";

const CNJ_VALIDO = "10092161720238260016";
const CNJ_VALIDO_2 = "10000003220238260016";

function genValid(n: string, ano: string, seg: string, tr: string, org: string) {
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

describe("ProcessoService", () => {
  let mockClient: DataJudClient;
  let service: ProcessoService;

  beforeEach(() => {
    mockClient = { buscarProcesso: vi.fn() } as unknown as DataJudClient;
    service = new ProcessoService(mockClient, {
      ttlMs: 60000,
      negativeTtlMs: 10000,
      maxEntries: 10,
    });
  });

  it("rejeita CNJ inválido", async () => {
    await expect(service.buscar("123")).rejects.toMatchObject({
      code: API_ERROR_CODES.CNJ_INVALIDO,
    });
  });

  it("rejeita tribunal não suportado", async () => {
    const cnjSeg2 = genValid("1000000", "2023", "2", "00", "0000");
    await expect(service.buscar(cnjSeg2)).rejects.toMatchObject({
      code: API_ERROR_CODES.TRIBUNAL_NAO_SUPORTADO,
    });
  });

  it("rejeita STF com mensagem clara de não disponível na API Pública", async () => {
    const cnjStf = genValid("1000000", "2023", "1", "00", "0000");
    await expect(service.buscar(cnjStf)).rejects.toMatchObject({
      code: API_ERROR_CODES.TRIBUNAL_NAO_SUPORTADO,
      message: expect.stringContaining("não disponível na API Pública do DataJud"),
    });
  });

  it("retorna null quando não encontrado e usa cache negativo", async () => {
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(null);
    const r1 = await service.buscar(CNJ_VALIDO);
    expect(r1).toBeNull();
    const r2 = await service.buscar(CNJ_VALIDO);
    expect(r2).toBeNull();
    expect(mockClient.buscarProcesso).toHaveBeenCalledTimes(1);
  });

  it("retorna processo encontrado e cacheia", async () => {
    const fakeRaw = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      movimentos: [
        {
          dataHora: "2023-08-24T10:00:00Z",
          nome: "Distribuição",
          codigo: 1,
          complementosTabelados: [],
        },
      ],
      partes: [
        {
          nome: "Parte A",
          tipoParte: "Autor",
          advogados: [{ nome: "Adv", numeroOAB: "123" }],
          representantes: [],
        },
      ],
      classe: { nome: "Teste", codigo: 1 },
      assuntos: [{ nome: "Assunto", codigo: 1 }],
    };
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(fakeRaw as never);
    const r1 = await service.buscar(CNJ_VALIDO);
    expect(r1).not.toBeNull();
    expect(r1?.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
    const r2 = await service.buscar(CNJ_VALIDO);
    expect(mockClient.buscarProcesso).toHaveBeenCalledTimes(1);
    expect(r2?.numeroProcesso).toBe(r1?.numeroProcesso);
  });

  it("deduplica requisições simultâneas (coalescing)", async () => {
    let calls = 0;
    vi.mocked(mockClient.buscarProcesso).mockImplementation(async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 20));
      return null;
    });
    const promises = Array.from({ length: 5 }, () => service.buscar(CNJ_VALIDO_2));
    const results = await Promise.all(promises);
    expect(results.every((r) => r === null)).toBe(true);
    expect(calls).toBe(1);
  });

  it("propaga erro do DataJud", async () => {
    const { ApiError } = await import("../utils/errors.js");
    vi.mocked(mockClient.buscarProcesso).mockRejectedValue(
      new ApiError(502, API_ERROR_CODES.DATAJUD_INDISPONIVEL, "x")
    );
    await expect(service.buscar(CNJ_VALIDO)).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_INDISPONIVEL,
    });
  });

  it("s Sanitiza partes expõe apenas nome/tipo e advogados filtrados", async () => {
    const fakeRaw = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      partes: [
        {
          nome: "João Silva",
          tipoParte: "Autor",
          documento: "123.456.789-00",
          tipoPessoa: "Física",
          advogados: [{ nome: "Dr. X", numeroOAB: "123" }, { nome: null }],
          representantes: [],
        },
      ],
      movimentos: [],
    };
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(fakeRaw as never);
    const r = await service.buscar(CNJ_VALIDO);
    expect(r?.partes[0]?.nome).toBe("João Silva");
    expect((r?.partes[0] as unknown as { documento?: string })?.documento).toBeUndefined();
    expect(r?.partes[0]?.advogados[0]?.nome).toBe("Dr. X");
  });

  it("lida com valorCausa nulo sem transformar em zero", async () => {
    const fakeRaw = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      valorCausa: null,
      movimentos: [],
      partes: [],
    };
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(fakeRaw as never);
    const r = await service.buscar(CNJ_VALIDO);
    expect(r?.valorCausa).toBeUndefined();
  });

  it("converte numeroOAB numérico para string", async () => {
    const fakeRaw = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      movimentos: [],
      partes: [
        {
          nome: "Parte A",
          tipoParte: "Autor",
          advogados: [{ nome: "Dra. Y", numeroOAB: 98765 }],
          representantes: [],
        },
      ],
    };
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(fakeRaw as never);
    const r = await service.buscar(CNJ_VALIDO);
    expect(r?.partes[0]?.advogados[0]?.numeroOAB).toBe("98765");
  });

  it("bloqueia processos com nivelSigilo > 0 com erro PROCESSO_SIGILOSO e não cacheia", async () => {
    const fakeSigiloso = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      nivelSigilo: 1,
      movimentos: [{ nome: "Despacho Sigiloso", dataHora: "2023-01-01T00:00:00Z" }],
      partes: [{ nome: "Parte Secreta", tipoParte: "Autor", advogados: [], representantes: [] }],
    };
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(fakeSigiloso as never);

    await expect(service.buscar(CNJ_VALIDO)).rejects.toMatchObject({
      code: API_ERROR_CODES.PROCESSO_SIGILOSO,
      status: 403,
    });

    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(null);
    const r = await service.buscar(CNJ_VALIDO);
    expect(r).toBeNull();
    expect(mockClient.buscarProcesso).toHaveBeenCalledTimes(2);
  });

  it("bloqueia processos com segredoJustica ou nivelSigilo string", async () => {
    const fakeSegredo = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      nivelSigilo: "SIGILOSO",
      movimentos: [],
      partes: [],
    };
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(fakeSegredo as never);

    await expect(service.buscar(CNJ_VALIDO)).rejects.toMatchObject({
      code: API_ERROR_CODES.PROCESSO_SIGILOSO,
      status: 403,
    });
  });

  it("coalesce múltiplas consultas simultâneas para o mesmo CNJ em uma única chamada HTTP", async () => {
    const fakeRaw = {
      numeroProcesso: CNJ_VALIDO,
      tribunal: "TJSP",
      movimentos: [
        {
          dataHora: "2023-08-24T10:00:00Z",
          nome: "Distribuição",
          codigo: 1,
          complementosTabelados: [],
        },
      ],
      partes: [],
    };
    let resolvePromise: (val: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(mockClient.buscarProcesso).mockReturnValue(promise as never);

    const [req1, req2, req3] = [
      service.buscar(CNJ_VALIDO),
      service.buscar(CNJ_VALIDO),
      service.buscar(CNJ_VALIDO),
    ];

    resolvePromise!(fakeRaw);
    const [res1, res2, res3] = await Promise.all([req1, req2, req3]);

    expect(res1?.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
    expect(res2?.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
    expect(res3?.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
    expect(mockClient.buscarProcesso).toHaveBeenCalledTimes(1);
  });

  it("utiliza chave composta de cache com numero e alias do tribunal", async () => {
    const mockStore = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    };
    const customService = new ProcessoService(
      mockClient,
      { ttlMs: 30000, negativeTtlMs: 5000, maxEntries: 10 },
      mockStore
    );
    vi.mocked(mockClient.buscarProcesso).mockResolvedValue(null);

    await customService.buscar(CNJ_VALIDO);

    expect(mockStore.get).toHaveBeenCalledWith(`${CNJ_VALIDO}:tjsp`);
    expect(mockStore.set).toHaveBeenCalledWith(`${CNJ_VALIDO}:tjsp`, null, 5000);
  });
});
