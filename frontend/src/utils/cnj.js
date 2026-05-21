export function limparNumeroCNJ(value) { return String(value || "").replace(/\D/g, ""); }
export function validarNumeroCNJ(value) {
  const numeroLimpo = limparNumeroCNJ(value);
  if (!/^\d{20}$/.test(numeroLimpo)) return false;
  const numeroSemDv = numeroLimpo.slice(0, 7) + numeroLimpo.slice(9, 20);
  const dv = numeroLimpo.slice(7, 9);
  return BigInt(numeroSemDv + dv) % 97n === 1n;
}
export function formatarNumeroCNJ(value) { const d = limparNumeroCNJ(value); let o = d.slice(0, 7); if (d.length > 7) o += `-${d.slice(7, 9)}`; if (d.length > 9) o += `.${d.slice(9, 13)}`; if (d.length > 13) o += `.${d.slice(13, 14)}`; if (d.length > 14) o += `.${d.slice(14, 16)}`; if (d.length > 16) o += `.${d.slice(16, 20)}`; if (d.length > 20) o += d.slice(20); return o; }
