export function formatarMascara(digitos: string): string {
  if (typeof digitos !== "string") return "";
  const d = digitos.slice(0, 20);
  let saida = d.slice(0, 7);
  if (d.length > 7) saida += "-" + d.slice(7, 9);
  if (d.length > 9) saida += "." + d.slice(9, 13);
  if (d.length > 13) saida += "." + d.slice(13, 14);
  if (d.length > 14) saida += "." + d.slice(14, 16);
  if (d.length > 16) saida += "." + d.slice(16, 20);
  return saida;
}
