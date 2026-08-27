import { describe, it, expect } from "vitest";
import { RequestCoalescer } from "./coalescer";

describe("RequestCoalescer", () => {
  it("deduplica chamadas simultâneas para mesma chave", async () => {
    const c = new RequestCoalescer<string, number>();
    let calls = 0;
    const fn = () => {
      calls++;
      return new Promise<number>((res) => setTimeout(() => res(42), 10));
    };
    const [a, b, d] = await Promise.all([c.run("k", fn), c.run("k", fn), c.run("k", fn)]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(d).toBe(42);
    expect(calls).toBe(1);
  });

  it("permite nova chamada após conclusão", async () => {
    const c = new RequestCoalescer<string, number>();
    let calls = 0;
    const fn = async () => {
      calls++;
      return 1;
    };
    await c.run("k", fn);
    await c.run("k", fn);
    expect(calls).toBe(2);
  });

  it("remove promise pendente em caso de erro e permite retry", async () => {
    const c = new RequestCoalescer<string, number>();
    let calls = 0;
    const failing = async () => {
      calls++;
      throw new Error("fail");
    };
    await expect(c.run("k", failing)).rejects.toThrow("fail");

    const ok = async () => 99;
    expect(await c.run("k", ok)).toBe(99);
    expect(calls).toBe(1);
  });

  it("não mistura chaves diferentes", async () => {
    const c = new RequestCoalescer<string, string>();
    const a = c.run("a", async () => "A");
    const b = c.run("b", async () => "B");
    expect(await a).toBe("A");
    expect(await b).toBe("B");
  });
});
