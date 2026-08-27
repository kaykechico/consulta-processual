import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LruCache } from "./cache";

describe("LruCache", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("armazena e recupera valor", () => {
    const c = new LruCache<string, number>(10);
    c.set("a", 1, 1000);
    expect(c.get("a")).toBe(1);
  });

  it("expira após TTL", () => {
    const c = new LruCache<string, number>(10);
    c.set("a", 1, 1000);
    vi.advanceTimersByTime(1001);
    expect(c.get("a")).toBeUndefined();
  });

  it("respeita maxEntries com LRU", () => {
    const c = new LruCache<string, number>(2);
    c.set("a", 1, 10000);
    c.set("b", 2, 10000);
    c.set("c", 3, 10000);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.get("c")).toBe(3);
  });

  it("get atualiza ordem LRU", () => {
    const c = new LruCache<string, number>(2);
    c.set("a", 1, 10000);
    c.set("b", 2, 10000);
    c.get("a");
    c.set("c", 3, 10000);
    expect(c.get("b")).toBeUndefined();
    expect(c.get("a")).toBe(1);
  });

  it("null/undefined ainda é considerado hit quando TTL válido", () => {
    const c = new LruCache<string, null>(10);
    c.set("k", null, 10000);
    expect(c.get("k")).toBe(null);
  });
});
