export class RequestCoalescer<K, V> {
  private readonly inFlight = new Map<K, Promise<V>>();

  run(key: K, fn: () => Promise<V>): Promise<V> {
    const existing = this.inFlight.get(key);
    if (existing) return existing;
    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }
}
