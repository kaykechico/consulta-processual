const RE_COMPACTA = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/;
const RE_ISO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function validaHora(h: number, min: number, seg: number): boolean {
  return h <= 23 && min <= 59 && seg <= 59;
}

export function parseDataJudDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  if (!v) return undefined;

  if (v.length <= 14 && RE_COMPACTA.test(v)) {
    const [, ano, mes, dia, hora, min, seg] = v.match(RE_COMPACTA) as RegExpMatchArray;
    const a = Number(ano);
    const m = Number(mes);
    const d = Number(dia);
    const h = Number(hora ?? 0);
    const mi = Number(min ?? 0);
    const s = Number(seg ?? 0);
    if (a < 1000 || m < 1 || m > 12 || d < 1 || d > 31 || !validaHora(h, mi, s)) return undefined;
    const data = new Date(Date.UTC(a, m - 1, d, h, mi, s));
    if (Number.isNaN(data.getTime())) return undefined;
    return data.toISOString();
  }

  if (RE_ISO_DATA.test(v)) {
    const data = new Date(`${v}T00:00:00.000Z`);
    return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
  }

  if (!RE_ISO.test(v)) return undefined;

  const comFuso = /(?:Z|[+-]\d{2}:?\d{2})$/.test(v) ? v : `${v}Z`;
  const data = new Date(comFuso);
  if (Number.isNaN(data.getTime())) return undefined;
  return data.toISOString();
}
