const RE_COMPACTA = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/;
const RE_ISO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const RE_ISO_OU_SQL =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

function validaHora(h: number, min: number, seg: number): boolean {
  return h <= 23 && min <= 59 && seg <= 59;
}

function validaCalendario(a: number, m: number, d: number): boolean {
  if (a < 1000 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const teste = new Date(Date.UTC(a, m - 1, d));
  return teste.getUTCFullYear() === a && teste.getUTCMonth() === m - 1 && teste.getUTCDate() === d;
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
    if (!validaCalendario(a, m, d) || !validaHora(h, mi, s)) return undefined;
    const data = new Date(Date.UTC(a, m - 1, d, h, mi, s));
    if (Number.isNaN(data.getTime())) return undefined;
    return data.toISOString();
  }

  if (RE_ISO_DATA.test(v)) {
    const [, ano, mes, dia] = v.match(RE_ISO_DATA) as RegExpMatchArray;
    const a = Number(ano);
    const m = Number(mes);
    const d = Number(dia);
    if (!validaCalendario(a, m, d)) return undefined;
    const data = new Date(Date.UTC(a, m - 1, d, 0, 0, 0));
    return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
  }

  const matchIsoSql = v.match(RE_ISO_OU_SQL);
  if (!matchIsoSql) return undefined;

  const [, ano, mes, dia, hora, min, seg] = matchIsoSql;
  const a = Number(ano);
  const m = Number(mes);
  const d = Number(dia);
  const h = Number(hora ?? 0);
  const mi = Number(min ?? 0);
  const s = Number(seg ?? 0);

  if (!validaCalendario(a, m, d) || !validaHora(h, mi, s)) return undefined;

  let normalizada = v.replace(" ", "T");
  const matchFusoSemDoisPontos = normalizada.match(/([+-]\d{2})(\d{2})$/);
  if (matchFusoSemDoisPontos) {
    normalizada = normalizada.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  } else if (!/(?:Z|[+-]\d{2}:?\d{2})$/.test(normalizada)) {
    normalizada = `${normalizada}Z`;
  }

  const data = new Date(normalizada);
  if (Number.isNaN(data.getTime())) return undefined;
  return data.toISOString();
}
