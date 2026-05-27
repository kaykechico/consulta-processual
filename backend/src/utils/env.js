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

export function parseBooleanEnv(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function parseTrustProxyEnv(value) {
  const raw = String(value ?? "").trim();
  const normalized = raw.toLowerCase();

  if (!raw || ["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  const numeric = Number(raw);

  if (Number.isInteger(numeric) && numeric >= 0) {
    return numeric;
  }

  if (["true", "yes", "on"].includes(normalized)) {
    return true;
  }

  const entries = raw.split(",").map((item) => item.trim()).filter(Boolean);

  return entries.length > 1 ? entries : raw;
}
