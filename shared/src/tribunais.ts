import { apenasDigitos } from "./cnj";

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
}

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
    lista.push({
      segmento: "6",
      codigo,
      alias: `tre-${estado.uf}`,
      nome: `Tribunal Regional Eleitoral de ${estado.nome}`,
      justica: "eleitoral",
    });
    lista.push({
      segmento: "8",
      codigo,
      alias: `tj${estado.uf}`,
      nome:
        codigo === "07"
          ? "Tribunal de Justiça do Distrito Federal e dos Territórios"
          : `Tribunal de Justiça do Estado de ${estado.nome}`,
      justica: "estadual",
    });
  }

  const tjm = [
    { codigo: "13", alias: "tjmmg", nome: "Tribunal de Justiça Militar do Estado de Minas Gerais" },
    {
      codigo: "21",
      alias: "tjmrs",
      nome: "Tribunal de Justiça Militar do Estado do Rio Grande do Sul",
    },
    { codigo: "26", alias: "tjmsp", nome: "Tribunal de Justiça Militar do Estado de São Paulo" },
  ];
  for (const t of tjm) {
    lista.push({
      segmento: "9",
      codigo: t.codigo,
      alias: t.alias,
      nome: t.nome,
      justica: "militar_estadual",
    });
  }

  return lista;
}

export const TRIBUNAIS: Tribunal[] = listaDeTribunais();

const POR_CHAVE = new Map<string, Tribunal>();
for (const t of TRIBUNAIS) POR_CHAVE.set(`${t.segmento}:${t.codigo}`, t);

export function getTribunalFromCNJ(input: string): Tribunal | null {
  const digitos = apenasDigitos(input);
  if (digitos.length < 16) return null;
  return POR_CHAVE.get(`${digitos[13]}:${digitos.slice(14, 16)}`) ?? null;
}

export function getTribunalByAlias(alias: string): Tribunal | null {
  return TRIBUNAIS.find((t) => t.alias === alias) ?? null;
}
