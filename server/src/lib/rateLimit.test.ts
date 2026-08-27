import { describe, it, expect } from "vitest";
import { FixedWindowRateLimiter, MemoryRateLimitStore } from "./rateLimit";

describe("FixedWindowRateLimiter", () => {
  it("permite até max requisições na janela", () => {
    const rl = new FixedWindowRateLimiter(2, 60_000);
    expect(rl.check("ip").allowed).toBe(true);
    expect(rl.check("ip").allowed).toBe(true);
    expect(rl.check("ip").allowed).toBe(false);
    rl.dispose();
  });

  it("reseta após janela", () => {
    const now = Date.now();
    const rl = new FixedWindowRateLimiter(1, 1000);
    expect(rl.check("ip", now).allowed).toBe(true);
    expect(rl.check("ip", now + 500).allowed).toBe(false);
    expect(rl.check("ip", now + 1001).allowed).toBe(true);
    rl.dispose();
  });

  it(" remaining e resetAt corretos", () => {
    const now = 1000000;
    const rl = new FixedWindowRateLimiter(3, 60000);
    const r1 = rl.check("ip", now);
    expect(r1.remaining).toBe(2);
    expect(r1.resetAt).toBe(now + 60000);
    const r2 = rl.check("ip", now);
    expect(r2.remaining).toBe(1);
    rl.dispose();
  });

  it("isola IPs diferentes", () => {
    const rl = new FixedWindowRateLimiter(1, 60000);
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
    expect(rl.check("b").allowed).toBe(false);
    rl.dispose();
  });

  it("evita vazamento de memória limitando número máximo de buckets", () => {
    const store = new MemoryRateLimitStore(60000, 3);
    store.increment("ip1", 60000, 5);
    store.increment("ip2", 60000, 5);
    store.increment("ip3", 60000, 5);
    store.increment("ip4", 60000, 5);
    expect(store.increment("ip1", 60000, 5).allowed).toBe(true);
    store.dispose();
  });
});

import { extrairIpCliente } from "../middlewares/rateLimit";
import { env } from "../config/env";
import type { Request } from "express";

describe("extrairIpCliente", () => {
  it("retorna socket address quando TRUST_PROXY é false", () => {
    const req = {
      headers: { "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "5.6.7.8" },
      socket: { remoteAddress: "192.168.1.50" },
      ip: "5.6.7.8",
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("192.168.1.50");
  });

  it("retorna fallback 127.0.0.1 quando nenhum endereço está presente", () => {
    const req = {
      headers: {},
      socket: {},
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("127.0.0.1");
  });

  it("ignora CF-Connecting-IP falso quando TRUST_CF é false", () => {
    const origTrustProxy = env.TRUST_PROXY;
    const origTrustCf = env.TRUST_CF;
    (env as Record<string, unknown>).TRUST_PROXY = "1";
    (env as Record<string, unknown>).TRUST_CF = false;

    const req = {
      headers: { "cf-connecting-ip": "200.1.2.3" },
      ip: "10.0.0.1",
      socket: { remoteAddress: "172.16.0.1" },
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("10.0.0.1");

    (env as Record<string, unknown>).TRUST_PROXY = origTrustProxy;
    (env as Record<string, unknown>).TRUST_CF = origTrustCf;
  });

  it("usa CF-Connecting-IP quando TRUST_PROXY e TRUST_CF são true", () => {
    const origTrustProxy = env.TRUST_PROXY;
    const origTrustCf = env.TRUST_CF;
    (env as Record<string, unknown>).TRUST_PROXY = "1";
    (env as Record<string, unknown>).TRUST_CF = true;

    const req = {
      headers: { "cf-connecting-ip": "203.0.113.50" },
      ip: "10.0.0.1",
      socket: { remoteAddress: "172.16.0.1" },
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("203.0.113.50");

    (env as Record<string, unknown>).TRUST_PROXY = origTrustProxy;
    (env as Record<string, unknown>).TRUST_CF = origTrustCf;
  });

  it("usa req.ip quando proxy é confiável mas CF não está habilitado", () => {
    const origTrustProxy = env.TRUST_PROXY;
    const origTrustCf = env.TRUST_CF;
    (env as Record<string, unknown>).TRUST_PROXY = "1";
    (env as Record<string, unknown>).TRUST_CF = false;

    const req = {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
      ip: "1.1.1.1",
      socket: { remoteAddress: "172.16.0.1" },
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("1.1.1.1");

    (env as Record<string, unknown>).TRUST_PROXY = origTrustProxy;
    (env as Record<string, unknown>).TRUST_CF = origTrustCf;
  });

  it("rejeita CF-Connecting-IP malformado e faz fallback para req.ip", () => {
    const origTrustProxy = env.TRUST_PROXY;
    const origTrustCf = env.TRUST_CF;
    (env as Record<string, unknown>).TRUST_PROXY = "1";
    (env as Record<string, unknown>).TRUST_CF = true;

    const req = {
      headers: { "cf-connecting-ip": "not-an-ip!!!" },
      ip: "198.51.100.1",
      socket: { remoteAddress: "172.16.0.1" },
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("198.51.100.1");

    (env as Record<string, unknown>).TRUST_PROXY = origTrustProxy;
    (env as Record<string, unknown>).TRUST_CF = origTrustCf;
  });

  it("cai para socket.remoteAddress quando req.ip é inválido e TRUST_PROXY ativo", () => {
    const origTrustProxy = env.TRUST_PROXY;
    const origTrustCf = env.TRUST_CF;
    (env as Record<string, unknown>).TRUST_PROXY = "1";
    (env as Record<string, unknown>).TRUST_CF = false;

    const req = {
      headers: {},
      ip: "",
      socket: { remoteAddress: "192.168.0.99" },
    } as unknown as Request;

    expect(extrairIpCliente(req)).toBe("192.168.0.99");

    (env as Record<string, unknown>).TRUST_PROXY = origTrustProxy;
    (env as Record<string, unknown>).TRUST_CF = origTrustCf;
  });
});
