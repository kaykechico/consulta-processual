const RE_CNJ = /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/;

export function apenasDigitos(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/\D/g, "");
}

export function normalizeCNJ(input: string): string {
  return apenasDigitos(input);
}

export function formatCNJ(digitos: string): string {
  if (typeof digitos !== "string") return "";
  const m = normalizeCNJ(digitos).match(RE_CNJ);
  if (!m) return digitos;
  const [, n, dv, ano, seg, tr, uo] = m;
  return `${n}-${dv}.${ano}.${seg}.${tr}.${uo}`;
}

const RE_CNJ_FORMATADO = /^\s*(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}|\d{20})\s*$/;

export function validateCNJ(input: string): boolean {
  if (typeof input !== "string") return false;
  if (!RE_CNJ_FORMATADO.test(input)) return false;
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

export function extrairCNJ(texto: string): string | null {
  if (!texto || typeof texto !== "string") return null;

  const mascara = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
  if (mascara) {
    const dig = apenasDigitos(mascara[0]);
    if (dig.length === 20) return dig;
  }

  const continuo = texto.match(/\d{20}/);
  if (continuo) return continuo[0];

  const digitos = apenasDigitos(texto);
  if (digitos.length === 20) return digitos;

  if (digitos.length > 20) {
    for (let i = 0; i <= digitos.length - 20; i++) {
      const cand = digitos.slice(i, i + 20);
      if (validateCNJ(cand)) return cand;
    }
  }
  return null;
}
