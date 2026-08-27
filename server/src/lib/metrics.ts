export interface MetricsCollector {
  incConsultasTotal(): void;
  incSucesso(): void;
  incNotFound(): void;
  incInvalidas(): void;
  incCacheHit(): void;
  incCacheMiss(): void;
  incCacheNegativeHit(): void;
  incCacheEviction(): void;
  incDatajudRequest(): void;
  incDatajudFailure(): void;
  incDatajudRetry(): void;
  addLatency(ms: number): void;
  incRateLimitHit(): void;
  snapshot(): Record<string, number>;
}

export class Metrics implements MetricsCollector {
  consultas_total = 0;
  consultas_sucesso = 0;
  consultas_not_found = 0;
  consultas_invalidas = 0;
  cache_hit = 0;
  cache_miss = 0;
  cache_negative_hit = 0;
  cache_eviction = 0;
  datajud_requests = 0;
  datajud_failures = 0;
  datajud_retries = 0;
  datajud_latency_ms_total = 0;
  rate_limit_hits = 0;

  incConsultasTotal() {
    this.consultas_total++;
  }
  incSucesso() {
    this.consultas_sucesso++;
  }
  incNotFound() {
    this.consultas_not_found++;
  }
  incInvalidas() {
    this.consultas_invalidas++;
  }
  incCacheHit() {
    this.cache_hit++;
  }
  incCacheMiss() {
    this.cache_miss++;
  }
  incCacheNegativeHit() {
    this.cache_negative_hit++;
  }
  incCacheEviction() {
    this.cache_eviction++;
  }
  incDatajudRequest() {
    this.datajud_requests++;
  }
  incDatajudFailure() {
    this.datajud_failures++;
  }
  incDatajudRetry() {
    this.datajud_retries++;
  }
  addLatency(ms: number) {
    this.datajud_latency_ms_total += ms;
  }
  incRateLimitHit() {
    this.rate_limit_hits++;
  }

  snapshot() {
    return {
      consultas_total: this.consultas_total,
      consultas_sucesso: this.consultas_sucesso,
      consultas_not_found: this.consultas_not_found,
      consultas_invalidas: this.consultas_invalidas,
      cache_hit: this.cache_hit,
      cache_miss: this.cache_miss,
      cache_negative_hit: this.cache_negative_hit,
      cache_eviction: this.cache_eviction,
      datajud_requests: this.datajud_requests,
      datajud_failures: this.datajud_failures,
      datajud_retries: this.datajud_retries,
      datajud_latency_avg_ms: this.datajud_requests
        ? Math.round(this.datajud_latency_ms_total / this.datajud_requests)
        : 0,
      rate_limit_hits: this.rate_limit_hits,
    };
  }
}

export const metrics = new Metrics();
