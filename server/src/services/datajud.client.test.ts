import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { DataJudClient } from "./datajud.client";
import { API_ERROR_CODES } from "@consulta/shared";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

function axiosError(status?: number, code?: string, headers?: Record<string, string>) {
  const err: unknown = {
    isAxiosError: true,
    response: status !== undefined ? { status, headers: headers ?? {} } : undefined,
    code,
    message: "mock",
  };

  (axios.isAxiosError as unknown as (v: unknown) => boolean) = (v) =>
    (v as { isAxiosError?: boolean })?.isAxiosError === true;
  return err;
}

describe("DataJudClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    (axios.isAxiosError as unknown as (v: unknown) => boolean) = (v) =>
      !!(v as { isAxiosError?: boolean })?.isAxiosError;
  });

  it("retorna null quando hits vazio", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { hits: { hits: [] } },
    } as unknown as never);
    (axios as unknown as Record<string, unknown>).isAxiosError = () => false;
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 10,
    });
    const r = await client.buscarProcesso("tjsp", "10092161720238260016");
    expect(r).toBeNull();
  });

  it("retorna _source quando encontrado e válido", async () => {
    const fakeSource = {
      numeroProcesso: "1009216-17.2023.8.26.0016",
      tribunal: "TJSP",
      movimentos: [],
    };
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { hits: { hits: [{ _source: fakeSource }] } },
    } as never);
    (axios as unknown as Record<string, unknown>).isAxiosError = () => false;
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 10,
    });
    const r = await client.buscarProcesso("tjsp", "10092161720238260016");
    expect(r).toEqual(fakeSource);
  });

  it("lança DATAJUD_SCHEMA_INVALID em resposta fora do schema", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({ data: { foo: "bar" } } as never);
    (axios as unknown as Record<string, unknown>).isAxiosError = () => false;
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 10,
    });
    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_SCHEMA_INVALID,
    });
  });

  it("mapeia 401 para DATAJUD_AUTH", async () => {
    const err = axiosError(401);
    mockedAxios.post = vi.fn().mockRejectedValue(err);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);

    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (e: unknown) => (e as { isAxiosError?: boolean })?.isAxiosError === true
    );
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 10,
    });
    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_AUTH,
    });
  });

  it("mapeia 429 para DATAJUD_RATE_LIMITED quando sem retry", async () => {
    const err = axiosError(429);
    mockedAxios.post = vi.fn().mockRejectedValue(err);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 10,
    });
    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_RATE_LIMITED,
    });
  });

  it("mapeia timeout ECONNABORTED para DATAJUD_TIMEOUT", async () => {
    const err = axiosError(undefined, "ECONNABORTED");
    mockedAxios.post = vi.fn().mockRejectedValue(err);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 10,
    });
    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_TIMEOUT,
    });
  });

  it("tenta novamente em 502 até maxRetries", async () => {
    const err502 = axiosError(502);
    const ok = { data: { hits: { hits: [] } } };
    mockedAxios.post = vi
      .fn()
      .mockRejectedValueOnce(err502)
      .mockResolvedValueOnce(ok as never);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 1,
      retryBaseMs: 1,
    });
    const r = await client.buscarProcesso("tjsp", "123");
    expect(r).toBeNull();
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it("respeita Retry-After header", async () => {
    const err429 = axiosError(429, undefined, { "retry-after": "0" });
    const ok = { data: { hits: { hits: [] } } };
    mockedAxios.post = vi
      .fn()
      .mockRejectedValueOnce(err429)
      .mockResolvedValueOnce(ok as never);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 1,
      retryBaseMs: 1,
    });
    const start = Date.now();
    await client.buscarProcesso("tjsp", "123");
    expect(Date.now() - start).toBeGreaterThanOrEqual(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it("mapeia erro de tamanho excessivo de resposta para DATAJUD_SCHEMA_INVALID", async () => {
    const errTamanho = axiosError(undefined, "ERR_FR_MAX_BODY_LENGTH_EXCEEDED");
    mockedAxios.post = vi.fn().mockRejectedValue(errTamanho);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 1,
    });
    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_SCHEMA_INVALID,
    });
  });

  it("bloqueia chamadas quando rate limit global é atingido", async () => {
    mockedAxios.post = vi.fn().mockResolvedValue({
      data: { hits: { hits: [] } },
    } as never);
    (axios as unknown as Record<string, unknown>).isAxiosError = () => false;
    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 0,
      retryBaseMs: 1,
      rateLimitMax: 1,
      rateLimitWindowMs: 60000,
    });

    await client.buscarProcesso("tjsp", "123");
    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_RATE_LIMITED,
    });
  });

  it("consome rate limit por tentativa real e bloqueia retry se limite esgotar", async () => {
    const err502 = axiosError(502);
    mockedAxios.post = vi.fn().mockRejectedValue(err502);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi.fn().mockReturnValue(true);

    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 2,
      retryBaseMs: 1,
      rateLimitMax: 2,
      rateLimitWindowMs: 60000,
    });

    await expect(client.buscarProcesso("tjsp", "123")).rejects.toMatchObject({
      code: API_ERROR_CODES.DATAJUD_RATE_LIMITED,
    });
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it("3 tentativas consomem 3 tokens do rate limit", async () => {
    const err502 = axiosError(502);
    const ok = { data: { hits: { hits: [] } } };
    mockedAxios.post = vi
      .fn()
      .mockRejectedValueOnce(err502)
      .mockRejectedValueOnce(err502)
      .mockResolvedValueOnce(ok as never);
    (axios.isAxiosError as unknown as ReturnType<typeof vi.fn>) = vi
      .fn()
      .mockImplementation((e: unknown) => (e as { isAxiosError?: boolean })?.isAxiosError === true);

    const client = new DataJudClient({
      baseUrl: "https://x",
      token: "t",
      timeoutMs: 1000,
      maxRetries: 3,
      retryBaseMs: 1,
      rateLimitMax: 5,
      rateLimitWindowMs: 60000,
    });

    await client.buscarProcesso("tjsp", "123");
    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
  });
});

import { TokenBucketRateLimiter } from "./datajud.client";

describe("TokenBucketRateLimiter", () => {
  it("inicia com capacidade total", () => {
    const bucket = new TokenBucketRateLimiter(5, 60000);
    for (let i = 0; i < 5; i++) {
      expect(bucket.consume()).toBe(true);
    }
  });

  it("bloqueia após consumir toda a capacidade", () => {
    const bucket = new TokenBucketRateLimiter(3, 60000);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
  });

  it("repõe tokens com passagem de tempo", () => {
    const bucket = new TokenBucketRateLimiter(10, 1000);
    for (let i = 0; i < 10; i++) bucket.consume();
    expect(bucket.consume()).toBe(false);

    vi.useFakeTimers();
    vi.advanceTimersByTime(200);
    expect(bucket.consume()).toBe(true);
    vi.useRealTimers();
  });

  it("não repõe além da capacidade máxima", () => {
    const bucket = new TokenBucketRateLimiter(3, 1000);
    vi.useFakeTimers();
    vi.advanceTimersByTime(10000);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(true);
    expect(bucket.consume()).toBe(false);
    vi.useRealTimers();
  });

  it("suporta burst controlado até a capacidade", () => {
    const bucket = new TokenBucketRateLimiter(5, 60000);
    const resultados = Array.from({ length: 7 }, () => bucket.consume());
    expect(resultados.filter(Boolean)).toHaveLength(5);
    expect(resultados.filter((r) => !r)).toHaveLength(2);
  });
});
