export const CATEGORIAS_MOVIMENTO = {
  AUDIENCIA: "AUDIENCIA",
  DECISAO: "DECISAO",
  SENTENCA: "SENTENCA",
  RECURSO: "RECURSO",
  DOCUMENTO: "DOCUMENTO",
  INTIMACAO: "INTIMACAO",
  DISTRIBUICAO: "DISTRIBUICAO",
  OUTROS: "OUTROS",
} as const;

export type CategoriaMovimento = (typeof CATEGORIAS_MOVIMENTO)[keyof typeof CATEGORIAS_MOVIMENTO];

export const ROTULO_CATEGORIA: Record<CategoriaMovimento, string> = {
  AUDIENCIA: "Audiências e julgamentos",
  DECISAO: "Decisões e despachos",
  SENTENCA: "Sentenças",
  RECURSO: "Recursos",
  DOCUMENTO: "Documentos",
  INTIMACAO: "Intimações e publicações",
  DISTRIBUICAO: "Distribuição",
  OUTROS: "Outras movimentações",
};

interface Regra {
  categoria: CategoriaMovimento;
  padrao: RegExp;
}

const REGRAS: Regra[] = [
  { categoria: "DISTRIBUICAO", padrao: /\b(distribui|redistribui|prevencao|sorteio)\b/i },
  {
    categoria: "SENTENCA",
    padrao: /\b(senten[çc]a|tr[âa]nsit[ou] em julgado|execu[çc][ãa]o de senten[çc]a)\b/i,
  },
  {
    categoria: "RECURSO",
    padrao:
      /\b(recurso|apela[çc][ãa]o|embarg[oa]s?|agravo|revis[ãa]o criminal|remessa necess[áa]ria|correi[çc][ãa]o)\b/i,
  },
  {
    categoria: "AUDIENCIA",
    padrao: /\b(audi[êe]ncia|julgamento|sess[ãa]o|sustenta[çc][ãa]o oral|pauta)\b/i,
  },
  {
    categoria: "INTIMACAO",
    padrao:
      /\b(intima[çc][ãa]o|notifica[çc][ãa]o|cita[çc][ãa]o|publica[çc][ãa]o no |vista ao|ci[êe]ncia)\b/i,
  },
  {
    categoria: "DECISAO",
    padrao:
      /\b(despacho|decidid|decis[ãa]o|liminar|tutela|cautelar|homologad|indeferid|admitid)\b/i,
  },
  {
    categoria: "DOCUMENTO",
    padrao:
      /\b(documento|certid[ãa]o|expedi[çc][ãa]o|juntada|peti[çc][ãa]o|mandado|of[ií]cio|petitor[ia]|guia|alvar[áa])\b/i,
  },
];

export function classificarMovimento(movimento: { nome: string }): CategoriaMovimento {
  const nome = movimento.nome ?? "";
  for (const regra of REGRAS) {
    if (regra.padrao.test(nome)) return regra.categoria;
  }
  return "OUTROS";
}
