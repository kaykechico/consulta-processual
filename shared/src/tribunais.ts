import { apenasDigitos } from "./cnj.js";

export type TipoJustica =
  | "supremo"
  | "superior"
  | "federal"
  | "trabalho"
  | "eleitoral"
  | "militar"
  | "estadual"
  | "militar_estadual";

export interface Tribunal {
  segmento: string;
  codigo: string;
  alias: string;
  nome: string;
  justica: TipoJustica;
  suportadoDatajud?: boolean;
  fonteOficial?: string;
}

const FONTES_OFICIAIS: Record<string, string> = {
  stf: "https://portal.stf.jus.br/processos/",
  stj: "https://processo.stj.jus.br/processo/pesquisa/",
  tst: "https://consultaprocessual.tst.jus.br/",
  tse: "https://consultaunificada.tse.jus.br/",
  stm: "https://www.stm.jus.br/servicos-stm/consulta-processual",
  tjsp: "https://esaj.tjsp.jus.br/cpopg/open.do",
  tjrj: "https://www.tjrj.jus.br/consultas",
  tjmg: "https://www.tjmg.jus.br/portal-tjmg/processos/consulta/",
  tjrs: "https://www.tjrs.jus.br/novo/busca/?return=proc",
  tjpr: "https://projudi.tjpr.jus.br/projudi/",
  tjsc: "https://www.tjsc.jus.br/processos",
  tjba: "https://www.tjba.jus.br/portal/processos/",
  tjpe: "https://www.tjpe.jus.br/consultaprocessual2/",
  tjce: "https://www.tjce.jus.br/servicos/consulta-processual/",
  tjgo: "https://projudi.tjgo.jus.br/",
  tjdft: "https://pesquisapje.tjdft.jus.br/",
  trf1: "https://pje1g.trf1.jus.br/consultapublica/",
  trf2: "https://eproc.trf2.jus.br/eproc/externo_controlador.php",
  trf3: "https://pje1g.trf3.jus.br/pje/ConsultaPublica/listView.seam",
  trf4: "https://eproc.trf4.jus.br/eproc2trf4/",
  trf5: "https://pje.trf5.jus.br/pje/ConsultaPublica/listView.seam",
  trf6: "https://eproc.trf6.jus.br/eproc/externo_controlador.php",
  trt2: "https://pje.trt2.jus.br/consultaprocessual/",
  "tre-dft": "https://pje1g.tse.jus.br/pje/ConsultaPublica/listView.seam",
};

const ESTADOS: Record<string, { uf: string; nome: string }> = {
  "01": { uf: "ac", nome: "Acre" },
  "02": { uf: "al", nome: "Alagoas" },
  "03": { uf: "ap", nome: "Amapá" },
  "04": { uf: "am", nome: "Amazonas" },
  "05": { uf: "ba", nome: "Bahia" },
  "06": { uf: "ce", nome: "Ceará" },
  "07": { uf: "df", nome: "Distrito Federal" },
  "08": { uf: "es", nome: "Espírito Santo" },
  "09": { uf: "go", nome: "Goiás" },
  "10": { uf: "ma", nome: "Maranhão" },
  "11": { uf: "mt", nome: "Mato Grosso" },
  "12": { uf: "ms", nome: "Mato Grosso do Sul" },
  "13": { uf: "mg", nome: "Minas Gerais" },
  "14": { uf: "pa", nome: "Pará" },
  "15": { uf: "pb", nome: "Paraíba" },
  "16": { uf: "pr", nome: "Paraná" },
  "17": { uf: "pe", nome: "Pernambuco" },
  "18": { uf: "pi", nome: "Piauí" },
  "19": { uf: "rj", nome: "Rio de Janeiro" },
  "20": { uf: "rn", nome: "Rio Grande do Norte" },
  "21": { uf: "rs", nome: "Rio Grande do Sul" },
  "22": { uf: "ro", nome: "Rondônia" },
  "23": { uf: "rr", nome: "Roraima" },
  "24": { uf: "sc", nome: "Santa Catarina" },
  "25": { uf: "se", nome: "Sergipe" },
  "26": { uf: "sp", nome: "São Paulo" },
  "27": { uf: "to", nome: "Tocantins" },
};

const ORDINAIS = [
  "1ª",
  "2ª",
  "3ª",
  "4ª",
  "5ª",
  "6ª",
  "7ª",
  "8ª",
  "9ª",
  "10ª",
  "11ª",
  "12ª",
  "13ª",
  "14ª",
  "15ª",
  "16ª",
  "17ª",
  "18ª",
  "19ª",
  "20ª",
  "21ª",
  "22ª",
  "23ª",
  "24ª",
];

function regiao(n: number): string {
  return `da ${ORDINAIS[n - 1]} Região`;
}

function listaDeTribunais(): Tribunal[] {
  const lista: Tribunal[] = [
    {
      segmento: "1",
      codigo: "00",
      alias: "stf",
      nome: "Supremo Tribunal Federal",
      justica: "supremo",
      suportadoDatajud: false,
    },
    {
      segmento: "3",
      codigo: "00",
      alias: "stj",
      nome: "Superior Tribunal de Justiça",
      justica: "superior",
    },
    {
      segmento: "5",
      codigo: "00",
      alias: "tst",
      nome: "Tribunal Superior do Trabalho",
      justica: "trabalho",
    },
    {
      segmento: "6",
      codigo: "00",
      alias: "tse",
      nome: "Tribunal Superior Eleitoral",
      justica: "eleitoral",
    },
    {
      segmento: "7",
      codigo: "00",
      alias: "stm",
      nome: "Superior Tribunal Militar",
      justica: "militar",
    },
  ];

  for (let i = 1; i <= 6; i++) {
    lista.push({
      segmento: "4",
      codigo: String(i).padStart(2, "0"),
      alias: `trf${i}`,
      nome: `Tribunal Regional Federal ${regiao(i)}`,
      justica: "federal",
    });
  }

  for (let i = 1; i <= 24; i++) {
    lista.push({
      segmento: "5",
      codigo: String(i).padStart(2, "0"),
      alias: `trt${i}`,
      nome: `Tribunal Regional do Trabalho ${regiao(i)}`,
      justica: "trabalho",
    });
  }

  for (const [codigo, estado] of Object.entries(ESTADOS)) {
    const isDF = codigo === "07";
    lista.push({
      segmento: "6",
      codigo,
      alias: isDF ? "tre-dft" : `tre-${estado.uf}`,
      nome: isDF
        ? "Tribunal Regional Eleitoral do Distrito Federal e dos Territórios"
        : `Tribunal Regional Eleitoral de ${estado.nome}`,
      justica: "eleitoral",
    });
    lista.push({
      segmento: "8",
      codigo,
      alias: isDF ? "tjdft" : `tj${estado.uf}`,
      nome: isDF
        ? "Tribunal de Justiça do Distrito Federal e dos Territórios"
        : `Tribunal de Justiça do Estado de ${estado.nome}`,
      justica: "estadual",
    });
  }

  const tjm = [
    { estado: "mg", codigo: "13", nome: "Minas Gerais" },
    { estado: "rs", codigo: "21", nome: "Rio Grande do Sul" },
    { estado: "sp", codigo: "26", nome: "São Paulo" },
  ];
  for (const t of tjm) {
    lista.push({
      segmento: "9",
      codigo: t.codigo,
      alias: `tjm${t.estado}`,
      nome: `Tribunal de Justiça Militar do Estado de ${t.nome}`,
      justica: "militar_estadual",
    });
  }

  for (const trib of lista) {
    if (FONTES_OFICIAIS[trib.alias]) {
      trib.fonteOficial = FONTES_OFICIAIS[trib.alias];
    }
  }

  return lista;
}

export const TRIBUNAIS = listaDeTribunais();

const POR_CHAVE = new Map<string, Tribunal>();
for (const t of TRIBUNAIS) {
  POR_CHAVE.set(`${t.segmento}-${t.codigo}`, t);
}

const POR_ALIAS = new Map<string, Tribunal>();
for (const t of TRIBUNAIS) {
  POR_ALIAS.set(t.alias, t);
}

export function getTribunalFromCNJ(cnj: string): Tribunal | null {
  const limpo = apenasDigitos(cnj);
  if (limpo.length < 16) return null;
  const segmento = limpo.charAt(13);
  const codigo = limpo.slice(14, 16);
  return POR_CHAVE.get(`${segmento}-${codigo}`) ?? null;
}

export function getTribunalByAlias(alias: string): Tribunal | null {
  return POR_ALIAS.get(alias.toLowerCase()) ?? null;
}
