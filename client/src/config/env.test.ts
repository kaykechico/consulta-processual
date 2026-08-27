import { describe, it, expect } from "vitest";
import { validarViteEnv } from "./env";

describe("Ambiente e Segurança do Cliente Vite", () => {
  it("aceita variáveis públicas seguras com prefixo VITE_", () => {
    const envSeguro = {
      VITE_API_URL: "https://api.exemplo.com",
      VITE_APP_TITLE: "Consulta Processual",
    };
    expect(validarViteEnv(envSeguro)).toEqual(envSeguro);
  });

  it("rejeita e lança erro caso detecte variáveis VITE_ expondo tokens ou credenciais", () => {
    const envInseguro = {
      VITE_DATAJUD_TOKEN: "segredo123",
    };
    expect(() => validarViteEnv(envInseguro)).toThrow(/Segredo detectado no ambiente do cliente/i);
  });

  it("rejeita variáveis VITE_ com sufixos ou termos sensíveis como SECRET, KEY ou PASSWORD", () => {
    expect(() => validarViteEnv({ VITE_API_SECRET: "xyz" })).toThrow();
    expect(() => validarViteEnv({ VITE_PRIVATE_KEY: "abc" })).toThrow();
    expect(() => validarViteEnv({ VITE_ADMIN_PASSWORD: "123" })).toThrow();
  });
});
