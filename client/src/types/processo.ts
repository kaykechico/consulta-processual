export interface NomeCodigoDTO {
  codigo: string;
  nome: string;
}

export interface OrgaoJulgadorDTO {
  codigo: string;
  nome: string;
}

export interface ParteDTO {
  tipo: string;
  nome: string;
  documento?: string;
  advogados: string[];
  representantes: string[];
  isMinisterioPublico: boolean;
}

export interface MovimentoDTO {
  codigo: string;
  nome: string;
  dataHora?: string;
  complementos: string[];
}

export interface DataRelevanteDTO {
  rotulo: string;
  valor?: string;
}

export interface ProcessoDTO {
  numeroProcesso: string;
  tribunal: string;
  grau?: string;
  instancia?: string;
  situacao?: string;
  valorCausa?: number;
  classe?: NomeCodigoDTO;
  assuntos: NomeCodigoDTO[];
  orgaoJulgador?: OrgaoJulgadorDTO;
  competencia?: string;
  sistema?: NomeCodigoDTO;
  formato?: NomeCodigoDTO;
  nivelSigilo?: number;
  partes: ParteDTO[];
  movimentos: MovimentoDTO[];
  datasRelevantes: DataRelevanteDTO[];
}