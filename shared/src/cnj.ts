const RE_CNJ = /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/;

export function apenasDigitos(input: string): string {
  return input.replace(/\D/g, "");
}

export function normalizeCNJ(input: string): string {
  return apenasDigitos(input);
}

export function formatCNJ(digitos: string): string {
  const m = normalizeCNJ(digitos).match(RE_CNJ);
  if (!m) return digitos;
  const [, n, dv, ano, seg, tr, uo] = m;
  return `${n}-${dv}.${ano}.${seg}.${tr}.${uo}`;
}

export function validateCNJ(input: string): boolean {
  const digitos = apenasDigitos(input);
  if (!RE_CNJ.test(digitos)) return false;
  const verificacao = BigInt(`${digitos.slice(0, 7)}${digitos.slice(9)}${digitos.slice(7, 9)}`);
  return verificacao % 97n === 1n;
}

export const CNJ_SEGMENTOS = {
  SUPREMO: "1",
  SUPERIOR: "3",
  FEDERAL: "4",
  TRABALHO: "5",
  ELEITORAL: "6",
  MILITAR: "7",
  ESTADUAL: "8",
  MILITAR_ESTADUAL: "9",
} as const;

export function getCNJSegment(input: string): string | null {
  const digitos = apenasDigitos(input);
  if (digitos.length < 14) return null;
  return digitos[13] ?? null;
}

export function getCNJTribunalCode(input: string): string | null {
  const digitos = apenasDigitos(input);
  if (digitos.length < 16) return null;
  return digitos.slice(14, 16) || null;
}
