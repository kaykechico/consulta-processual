export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number, max: number, now?: number): RateLimitResult;
  dispose?(): void;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();
  private readonly cleaner: NodeJS.Timeout;
  private readonly maxBuckets: number;

  constructor(cleanupIntervalMs = 60_000, maxBuckets = 10_000) {
    this.maxBuckets = maxBuckets;
    this.cleaner = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(key);
      }
    }, cleanupIntervalMs).unref();
  }

  increment(key: string, windowMs: number, max: number, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (this.buckets.size >= this.maxBuckets) {
        const oldest = this.buckets.keys().next().value;
        if (oldest !== undefined) this.buckets.delete(oldest);
      }
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
    }
    bucket.count += 1;
    return {
      allowed: bucket.count <= max,
      remaining: Math.max(0, max - bucket.count),
      resetAt: bucket.resetAt,
    };
  }

  dispose(): void {
    clearInterval(this.cleaner);
    this.buckets.clear();
  }
}

export class FixedWindowRateLimiter {
  private readonly store: RateLimitStore;

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    store?: RateLimitStore
  ) {
    this.store = store ?? new MemoryRateLimitStore(Math.max(windowMs, 60_000));
  }

  check(key: string, now = Date.now()): RateLimitResult {
    return this.store.increment(key, this.windowMs, this.max, now);
  }

  dispose(): void {
    this.store.dispose?.();
  }
}
