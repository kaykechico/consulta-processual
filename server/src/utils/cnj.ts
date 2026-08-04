const RE_CNJ = /^(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})$/;

export function apenasDigitos(input: string): string {
  return input.replace(/\D/g, "");
}

export function formatarCNJ(digitos: string): string {
  const [, n, dv, ano, seg, tr, uo] = digitos.match(RE_CNJ) ?? [];
  return `${n}-${dv}.${ano}.${seg}.${tr}.${uo}`;
}

export function validarCNJ(input: string): boolean {
  const digitos = apenasDigitos(input);
  if (!RE_CNJ.test(digitos)) return false;
  const verificacao = BigInt(
    `${digitos.slice(0, 7)}${digitos.slice(9)}${digitos.slice(7, 9)}`
  );
  return verificacao % 97n === 1n;
}
