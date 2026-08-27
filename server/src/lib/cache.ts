import { metrics } from "./metrics";

export interface CacheStore<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttlMs: number): void;
  delete?(key: K): void;
}

export class LruCache<K, V> implements CacheStore<K, V> {
  private readonly map = new Map<K, { value: V; expiresAt: number }>();

  constructor(private readonly maxEntries: number) {
    if (maxEntries < 1) throw new Error("maxEntries deve ser >= 1");
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs: number): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
      metrics.incCacheEviction();
    }
  }

  delete(key: K): void {
    this.map.delete(key);
  }
}
