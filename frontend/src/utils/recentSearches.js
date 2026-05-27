const STORAGE_KEY = "consulta_juridica_recent_searches";
const MAX_ITEMS = 8;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item.numeroFormatado === "string" && typeof item.numeroLimpo === "string")
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveRecentSearch(search) {
  if (!search?.numeroFormatado || !search?.numeroLimpo) {
    return getRecentSearches();
  }

  const current = getRecentSearches();

  const filtered = current.filter((item) => item.numeroLimpo !== search.numeroLimpo);

  const next = [
    {
      numeroFormatado: search.numeroFormatado,
      numeroLimpo: search.numeroLimpo,
      tribunal: search.tribunal || "",
      searchedAt: new Date().toISOString()
    },
    ...filtered
  ].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }

  return next;
}

export function removeRecentSearch(numeroLimpo) {
  const current = getRecentSearches();
  const next = current.filter((item) => item.numeroLimpo !== numeroLimpo);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }

  return next;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return [];
  }
  return [];
}
