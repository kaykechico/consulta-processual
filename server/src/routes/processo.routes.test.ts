import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";

vi.mock("../services/processo.service", async () => {
  const actual = await vi.importActual<typeof import("../services/processo.service")>(
    "../services/processo.service"
  );
  return {
    ...actual,
    processoService: {
      buscar: vi.fn(),
    },
  };
});

import { processoService } from "../services/processo.service";
import { API_ERROR_CODES } from "@consulta/shared";
import { ApiError } from "../utils/errors";

describe("API rotas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET /api/v1/health retorna ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/v1/ready retorna ready", async () => {
    const res = await request(app).get("/api/v1/ready");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");
  });

  it("GET /api/v1/openapi.json retorna spec", async () => {
    const res = await request(app).get("/api/v1/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.1.0");
    expect(res.body.paths["/v1/processos"].get).toBeDefined();
    expect(res.body.paths["/v1/processos"].post).toBeDefined();
    expect(res.body.components.headers.RateLimitLimit).toBeDefined();
  });

  it("GET /api/v1/processos/:numero rejeita CNJ inválido", async () => {
    vi.mocked(processoService.buscar).mockRejectedValue(
      new ApiError(422, API_ERROR_CODES.CNJ_INVALIDO, "inv")
    );
    const res = await request(app).get("/api/v1/processos/123");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(API_ERROR_CODES.CNJ_INVALIDO);
  });

  it("GET /api/v1/processos/:numero retorna processo encontrado", async () => {
    const fakeProcesso = {
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      partes: [],
      movimentos: [],
      assuntos: [],
      datasRelevantes: [],
    };
    vi.mocked(processoService.buscar).mockResolvedValue(fakeProcesso as never);
    const res = await request(app).get("/api/v1/processos/10092161720238260016");
    expect(res.status).toBe(200);
    expect(res.body.processo.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
  });

  it("GET /api/v1/processos/:numero retorna 404 quando não encontrado", async () => {
    vi.mocked(processoService.buscar).mockResolvedValue(null);
    const res = await request(app).get("/api/v1/processos/10092161720238260016");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe(API_ERROR_CODES.PROCESSO_NAO_ENCONTRADO);
  });

  it("GET /api/v1/processos/:numero retorna 403 quando processo é sigiloso", async () => {
    vi.mocked(processoService.buscar).mockRejectedValue(
      new ApiError(403, API_ERROR_CODES.PROCESSO_SIGILOSO, "Sigiloso")
    );
    const res = await request(app).get("/api/v1/processos/10092161720238260016");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(API_ERROR_CODES.PROCESSO_SIGILOSO);
  });

  it("suporta requisições com X-Forwarded-For sem quebrar rate limit", async () => {
    const fakeProcesso = {
      numeroProcesso: "x",
      tribunal: "y",
      partes: [],
      movimentos: [],
      assuntos: [],
      datasRelevantes: [],
    };
    vi.mocked(processoService.buscar).mockResolvedValue(fakeProcesso as never);
    const res = await request(app)
      .get("/api/v1/processos/10092161720238260016")
      .set("X-Forwarded-For", "203.0.113.195, 10.0.0.1");
    expect(res.status).toBe(200);
    expect(res.headers["x-ratelimit-limit"]).toBeDefined();
  });

  it("permite preflight OPTIONS sem consumir quota", async () => {
    const res = await request(app).options("/api/v1/processos/10092161720238260016");
    expect(res.status).toBeLessThan(400);
  });

  it("rota inexistente retorna 404", async () => {
    const res = await request(app).get("/api/naoexiste");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ROTA_NAO_ENCONTRADA");
    expect(res.body.error.message).toBe("Rota não encontrada.");
  });

  it("erro assíncrono não tratado retorna 500 ERRO_INTERNO sem vazar stack trace", async () => {
    vi.mocked(processoService.buscar).mockRejectedValue(
      new Error("falha interna no driver de banco")
    );
    const res = await request(app).get("/api/v1/processos/10092161720238260016");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe(API_ERROR_CODES.ERRO_INTERNO);
    expect(res.body.error.message).toBe("Erro interno no servidor.");
    expect(res.body.error.stack).toBeUndefined();
    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("falha interna no driver de banco");
  });

  it("GET /api/v1/processos com query parameter retorna processo", async () => {
    const fakeProcesso = {
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      partes: [],
      movimentos: [],
      assuntos: [],
      datasRelevantes: [],
    };
    vi.mocked(processoService.buscar).mockResolvedValue(fakeProcesso as never);
    const res = await request(app).get("/api/v1/processos?numero=10092161720238260016");
    expect(res.status).toBe(200);
    expect(res.body.processo.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
  });

  it("POST /api/v1/processos com body JSON retorna processo", async () => {
    const fakeProcesso = {
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      partes: [],
      movimentos: [],
      assuntos: [],
      datasRelevantes: [],
    };
    vi.mocked(processoService.buscar).mockResolvedValue(fakeProcesso as never);
    const res = await request(app)
      .post("/api/v1/processos")
      .send({ numero: "10092161720238260016" });
    expect(res.status).toBe(200);
    expect(res.body.processo.numeroProcesso).toBe("1009216-17.2023.8.26.0016");
  });

  it("POST /api/v1/processos sem número retorna 422", async () => {
    const res = await request(app).post("/api/v1/processos").send({});
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe(API_ERROR_CODES.NUMERO_OBRIGATORIO);
  });

  it("POST /api/v1/processos com JSON inválido retorna 400", async () => {
    const res = await request(app)
      .post("/api/v1/processos")
      .set("Content-Type", "application/json")
      .send("{");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(API_ERROR_CODES.JSON_INVALIDO);
    expect(res.body.error.requestId).toBeDefined();
  });
});
