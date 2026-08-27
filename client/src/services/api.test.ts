import { describe, expect, it, vi } from "vitest";

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({ get: mockGet })),
    isAxiosError: vi.fn(() => false),
  },
}));

import { buscarProcesso } from "./api";

describe("api", () => {
  it("valida a resposta do servidor", async () => {
    mockGet.mockResolvedValueOnce({ data: { processo: { numeroProcesso: "invalido" } } });

    await expect(buscarProcesso("10092161720238260016")).rejects.toMatchObject({
      code: "RESPOSTA_INVALIDA",
    });
  });
});
