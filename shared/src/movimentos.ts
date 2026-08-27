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

const MAPA_CODIGOS_CNJ: Record<number, CategoriaMovimento> = {
  26: "DISTRIBUICAO",
  36: "DISTRIBUICAO",
  107: "DISTRIBUICAO",
  108: "DISTRIBUICAO",
  109: "DISTRIBUICAO",
  865: "DISTRIBUICAO",
  866: "DISTRIBUICAO",
  193: "SENTENCA",
  219: "SENTENCA",
  220: "SENTENCA",
  221: "SENTENCA",
  237: "SENTENCA",
  246: "SENTENCA",
  466: "SENTENCA",
  848: "SENTENCA",
  1000: "SENTENCA",
  3: "DECISAO",
  11: "DECISAO",
  25: "DECISAO",
  27: "DECISAO",
  28: "DECISAO",
  48: "DECISAO",
  49: "DECISAO",
  11009: "DECISAO",
  11010: "DECISAO",
  9: "AUDIENCIA",
  970: "AUDIENCIA",
  971: "AUDIENCIA",
  972: "AUDIENCIA",
  973: "AUDIENCIA",
  974: "AUDIENCIA",
  975: "AUDIENCIA",
  976: "AUDIENCIA",
  977: "AUDIENCIA",
  978: "AUDIENCIA",
  979: "AUDIENCIA",
  980: "AUDIENCIA",
  981: "AUDIENCIA",
  110: "RECURSO",
  111: "RECURSO",
  112: "RECURSO",
  113: "RECURSO",
  114: "RECURSO",
  115: "RECURSO",
  116: "RECURSO",
  117: "RECURSO",
  118: "RECURSO",
  119: "RECURSO",
  120: "RECURSO",
  121: "RECURSO",
  804: "RECURSO",
  60: "INTIMACAO",
  92: "INTIMACAO",
  101: "INTIMACAO",
  102: "INTIMACAO",
  103: "INTIMACAO",
  104: "INTIMACAO",
  105: "INTIMACAO",
  106: "INTIMACAO",
  1061: "INTIMACAO",
  11383: "INTIMACAO",
  58: "DOCUMENTO",
  85: "DOCUMENTO",
  581: "DOCUMENTO",
  1051: "DOCUMENTO",
  11382: "DOCUMENTO",
  11384: "DOCUMENTO",
};

export function classificarMovimento(movimento: {
  nome: string;
  codigo?: number;
}): CategoriaMovimento {
  if (typeof movimento.codigo === "number" && MAPA_CODIGOS_CNJ[movimento.codigo]) {
    return MAPA_CODIGOS_CNJ[movimento.codigo];
  }
  const nome = movimento.nome ?? "";
  for (const regra of REGRAS) {
    if (regra.padrao.test(nome)) return regra.categoria;
  }
  return "OUTROS";
}
