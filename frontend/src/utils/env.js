export function parseIntegerEnv(value, defaultValue, options = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  const normalized = typeof value === "number" ? value : String(value ?? "").trim();

  if (normalized === "") {
    return defaultValue;
  }

  const parsed = typeof normalized === "number" ? normalized : Number(normalized);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return defaultValue;
  }

  return parsed;
}
