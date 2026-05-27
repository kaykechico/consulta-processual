export function limparNumeroCNJ(value) { return String(value || "").replace(/\D/g, ""); }
export function validarNumeroCNJ(numeroLimpo) {
  if (!/^\d{20}$/.test(String(numeroLimpo || ""))) return false;
  const numeroSemDv = numeroLimpo.slice(0, 7) + numeroLimpo.slice(9, 20);
  const dv = numeroLimpo.slice(7, 9);
  return BigInt(numeroSemDv + dv) % 97n === 1n;
}
export function formatarNumeroCNJ(n) { const v = limparNumeroCNJ(n); return v.length === 20 ? `${v.slice(0,7)}-${v.slice(7,9)}.${v.slice(9,13)}.${v.slice(13,14)}.${v.slice(14,16)}.${v.slice(16,20)}` : v; }
const jf = {"01":"api_publica_trf1","02":"api_publica_trf2","03":"api_publica_trf3","04":"api_publica_trf4","05":"api_publica_trf5","06":"api_publica_trf6"};
const jt = Object.fromEntries(Array.from({length:24},(_,i)=>[String(i+1).padStart(2,"0"),`api_publica_trt${i+1}`]));
const je = {"01":"api_publica_tjac","02":"api_publica_tjal","03":"api_publica_tjap","04":"api_publica_tjam","05":"api_publica_tjba","06":"api_publica_tjce","07":"api_publica_tjdft","08":"api_publica_tjes","09":"api_publica_tjgo","10":"api_publica_tjma","11":"api_publica_tjmt","12":"api_publica_tjms","13":"api_publica_tjmg","14":"api_publica_tjpa","15":"api_publica_tjpb","16":"api_publica_tjpr","17":"api_publica_tjpe","18":"api_publica_tjpi","19":"api_publica_tjrj","20":"api_publica_tjrn","21":"api_publica_tjrs","22":"api_publica_tjro","23":"api_publica_tjrr","24":"api_publica_tjsc","25":"api_publica_tjse","26":"api_publica_tjsp","27":"api_publica_tjto"};
const tre = {"01":"api_publica_tre-ac","02":"api_publica_tre-al","03":"api_publica_tre-ap","04":"api_publica_tre-am","05":"api_publica_tre-ba","06":"api_publica_tre-ce","07":"api_publica_tre-df","08":"api_publica_tre-es","09":"api_publica_tre-go","10":"api_publica_tre-ma","11":"api_publica_tre-mt","12":"api_publica_tre-ms","13":"api_publica_tre-mg","14":"api_publica_tre-pa","15":"api_publica_tre-pb","16":"api_publica_tre-pr","17":"api_publica_tre-pe","18":"api_publica_tre-pi","19":"api_publica_tre-rj","20":"api_publica_tre-rn","21":"api_publica_tre-rs","22":"api_publica_tre-ro","23":"api_publica_tre-rr","24":"api_publica_tre-sc","25":"api_publica_tre-se","26":"api_publica_tre-sp","27":"api_publica_tre-to"};
const jme = {"13":"api_publica_tjmmg","21":"api_publica_tjmrs","26":"api_publica_tjmsp"};
export const tribunaisSuperiores = ["api_publica_stj","api_publica_tst","api_publica_tse","api_publica_stm"];
export function detectarTribunalPorCNJ(n) {
  if (!validarNumeroCNJ(n)) return null;
  const j = n.slice(13, 14);
  const tr = n.slice(14, 16);
  if (tr === "00") {
    if (j === "3") return "api_publica_stj";
    if (j === "5") return "api_publica_tst";
    if (j === "6") return "api_publica_tse";
    if (j === "7") return "api_publica_stm";
  }
  if (j === "4") return jf[tr] || null;
  if (j === "5") return jt[tr] || null;
  if (j === "6") return tre[tr] || null;
  if (j === "8") return je[tr] || null;
  if (j === "9") return jme[tr] || null;
  return null;
}
export function listarAliasesDataJud() { return [...tribunaisSuperiores, ...Object.values(jf), ...Object.values(jt), ...Object.values(je), ...Object.values(tre), ...Object.values(jme)]; }
