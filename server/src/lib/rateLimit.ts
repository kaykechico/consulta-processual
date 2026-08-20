export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();
  private readonly cleaner: NodeJS.Timeout;

  constructor(
    private readonly max: number,
    private readonly windowMs: number
  ) {
    this.cleaner = setInterval(
      () => {
        const now = Date.now();
        for (const [key, bucket] of this.buckets) {
          if (bucket.resetAt <= now) this.buckets.delete(key);
        }
      },
      Math.max(windowMs, 60_000)
    ).unref();
  }

  check(key: string, now = Date.now()): RateLimitResult {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.max - 1, resetAt: now + this.windowMs };
    }
    bucket.count += 1;
    return {
      allowed: bucket.count <= this.max,
      remaining: Math.max(0, this.max - bucket.count),
      resetAt: bucket.resetAt,
    };
  }

  dispose(): void {
    clearInterval(this.cleaner);
    this.buckets.clear();
  }
}
