import { describe, it, expect, vi } from "vitest";
import { resolverTrustProxy, verificarTrustProxyConfig } from "../app";
import type { logger } from "../lib/logger";

describe("Configuração de Proxy e Ambiente", () => {
  it("resolve strings de trust proxy corretamente", () => {
    expect(resolverTrustProxy("false")).toBe(false);
    expect(resolverTrustProxy("true")).toBe(1);
    expect(resolverTrustProxy("1")).toBe(1);
    expect(resolverTrustProxy("2")).toBe(2);
    expect(resolverTrustProxy("loopback")).toBe("loopback");
    expect(resolverTrustProxy("10.0.0.1, 10.0.0.2")).toEqual(["10.0.0.1", "10.0.0.2"]);
    expect(resolverTrustProxy("uniquelocal")).toBe("uniquelocal");
  });

  it("emite aviso quando em produção com TRUST_PROXY=false e TRUST_CF=false", () => {
    const mockLogger = {
      warn: vi.fn(),
    } as unknown as typeof logger;

    verificarTrustProxyConfig(
      { NODE_ENV: "production", TRUST_PROXY: "false", TRUST_CF: false },
      mockLogger
    );

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ trustProxy: "false", trustCf: false }),
      expect.stringContaining("Ambiente de produção sem TRUST_PROXY ou TRUST_CF")
    );
  });

  it("não emite aviso quando TRUST_PROXY está configurado em produção", () => {
    const mockLogger = {
      warn: vi.fn(),
    } as unknown as typeof logger;

    verificarTrustProxyConfig(
      { NODE_ENV: "production", TRUST_PROXY: "1", TRUST_CF: false },
      mockLogger
    );

    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it("não emite aviso quando TRUST_CF=true em produção", () => {
    const mockLogger = {
      warn: vi.fn(),
    } as unknown as typeof logger;

    verificarTrustProxyConfig(
      { NODE_ENV: "production", TRUST_PROXY: "false", TRUST_CF: true },
      mockLogger
    );

    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it("não emite aviso em ambiente de desenvolvimento ou teste", () => {
    const mockLogger = {
      warn: vi.fn(),
    } as unknown as typeof logger;

    verificarTrustProxyConfig(
      { NODE_ENV: "development", TRUST_PROXY: "false", TRUST_CF: false },
      mockLogger
    );

    expect(mockLogger.warn).not.toHaveBeenCalled();
  });
});
