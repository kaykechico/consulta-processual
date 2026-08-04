const ESTADOS: Record<string, string> = {
  "01": "ac", "02": "al", "03": "ap", "04": "am", "05": "ba", "06": "ce",
  "07": "df", "08": "es", "09": "go", "10": "ma", "11": "mt", "12": "ms",
  "13": "mg", "14": "pa", "15": "pb", "16": "pr", "17": "pe", "18": "pi",
  "19": "rj", "20": "rn", "21": "rs", "22": "ro", "23": "rr", "24": "sc",
  "25": "se", "26": "sp", "27": "to",
};

function naFaixa(tr: string, min: number, max: number): boolean {
  const n = Number(tr);
  return n >= min && n <= max;
}

export function siglaDataJud(numero: string): string | null {
  const segmento = numero[13];
  const tr = numero.slice(14, 16);
  switch (segmento) {
    case "1":
      return tr === "00" ? "stf" : null;
    case "3":
      return tr === "00" ? "stj" : null;
    case "4":
      return naFaixa(tr, 1, 6) ? `trf${Number(tr)}` : null;
    case "5":
      return tr === "00" ? "tst" : naFaixa(tr, 1, 24) ? `trt${Number(tr)}` : null;
    case "6":
      return tr === "00" ? "tse" : ESTADOS[tr] ? `tre-${ESTADOS[tr]}` : null;
    case "7":
      return tr === "00" ? "stm" : null;
    case "8":
      return ESTADOS[tr] ? `tj${ESTADOS[tr]}` : null;
    default:
      return null;
  }
}
