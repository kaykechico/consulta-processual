export function getSource(resultado) {
  return resultado?.data?.source || {};
}

export function corrigirTexto(texto) {
  if (typeof texto !== "string") {
    return texto;
  }

  const mapa = [
    ["Ã¡", "á"],
    ["Ã ", "à"],
    ["Ã¢", "â"],
    ["Ã£", "ã"],
    ["Ã¤", "ä"],
    ["ÃÁ", "Á"],
    ["Ã€", "À"],
    ["Ã‚", "Â"],
    ["Ãƒ", "Ã"],
    ["Ã„", "Ä"],
    ["Ã©", "é"],
    ["Ã¨", "è"],
    ["Ãª", "ê"],
    ["Ã«", "ë"],
    ["Ã‰", "É"],
    ["Ãˆ", "È"],
    ["ÃŠ", "Ê"],
    ["Ã‹", "Ë"],
    ["Ã­", "í"],
    ["Ã¬", "ì"],
    ["Ã®", "î"],
    ["Ã¯", "ï"],
    ["Ã�", "Í"],
    ["ÃŒ", "Ì"],
    ["ÃŽ", "Î"],
    ["Ã�", "Ï"],
    ["Ã³", "ó"],
    ["Ã²", "ò"],
    ["Ã´", "ô"],
    ["Ãµ", "õ"],
    ["Ã¶", "ö"],
    ["Ã“", "Ó"],
    ["Ã’", "Ò"],
    ["Ã”", "Ô"],
    ["Ã•", "Õ"],
    ["Ã–", "Ö"],
    ["Ãº", "ú"],
    ["Ã¹", "ù"],
    ["Ã»", "û"],
    ["Ã¼", "ü"],
    ["Ãš", "Ú"],
    ["Ã™", "Ù"],
    ["Ã›", "Û"],
    ["Ãœ", "Ü"],
    ["Ã§", "ç"],
    ["Ã‡", "Ç"],
    ["Âº", "º"],
    ["Âª", "ª"],
    ["Â§", "§"],
    ["Â°", "°"],
    ["Â´", "´"],
    ["Â¨", "¨"],
    ["Â·", "·"],
    ["Â", ""],
    ["â€“", "–"],
    ["â€”", "—"],
    ["â€˜", "‘"],
    ["â€™", "’"],
    ["â€œ", "“"],
    ["â€�", "”"],
    ["â€¦", "…"]
  ];

  return mapa.reduce((resultado, [errado, correto]) => {
    return resultado.replaceAll(errado, correto);
  }, texto).normalize("NFC").trim();
}

export function formatarData(value) {
  if (!value) {
    return "Não informado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return corrigirTexto(String(value));
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function traduzirValor(value) {
  const texto = corrigirTexto(String(value));

  const mapa = {
    api_publica_stj: "Superior Tribunal de Justiça",
    api_publica_tst: "Tribunal Superior do Trabalho",
    api_publica_tse: "Tribunal Superior Eleitoral",
    api_publica_stm: "Superior Tribunal Militar",
    api_publica_trf1: "Tribunal Regional Federal da 1ª Região",
    api_publica_trf2: "Tribunal Regional Federal da 2ª Região",
    api_publica_trf3: "Tribunal Regional Federal da 3ª Região",
    api_publica_trf4: "Tribunal Regional Federal da 4ª Região",
    api_publica_trf5: "Tribunal Regional Federal da 5ª Região",
    api_publica_trf6: "Tribunal Regional Federal da 6ª Região",
    api_publica_tjac: "TJAC",
    api_publica_tjal: "TJAL",
    api_publica_tjap: "TJAP",
    api_publica_tjam: "TJAM",
    api_publica_tjba: "TJBA",
    api_publica_tjce: "TJCE",
    api_publica_tjdft: "TJDFT",
    api_publica_tjes: "TJES",
    api_publica_tjgo: "TJGO",
    api_publica_tjma: "TJMA",
    api_publica_tjmt: "TJMT",
    api_publica_tjms: "TJMS",
    api_publica_tjmg: "TJMG",
    api_publica_tjpa: "TJPA",
    api_publica_tjpb: "TJPB",
    api_publica_tjpr: "TJPR",
    api_publica_tjpe: "TJPE",
    api_publica_tjpi: "TJPI",
    api_publica_tjrj: "TJRJ",
    api_publica_tjrn: "TJRN",
    api_publica_tjrs: "TJRS",
    api_publica_tjro: "TJRO",
    api_publica_tjrr: "TJRR",
    api_publica_tjsc: "TJSC",
    api_publica_tjse: "TJSE",
    api_publica_tjsp: "TJSP",
    api_publica_tjto: "TJTO",
    G1: "1º grau",
    G2: "2º grau",
    JE: "Juizado especial",
    TR: "Turma recursal"
  };

  if (mapa[texto]) {
    return mapa[texto];
  }

  if (/^api_publica_trt\d+$/.test(texto)) {
    return `Tribunal Regional do Trabalho da ${texto.replace("api_publica_trt", "")}ª Região`;
  }

  return texto;
}

export function formatarTexto(value) {
  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return traduzirValor(value);
  }

  if (Array.isArray(value)) {
    const lista = value.map((item) => formatarTexto(item)).filter(Boolean);
    return lista.length > 0 ? lista.join(", ") : "Não informado";
  }

  return extrairNome(value);
}

export function extrairNome(value) {
  if (!value) {
    return "Não informado";
  }

  if (typeof value === "string") {
    return traduzirValor(value);
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (value.sigla && value.nome) {
    return `${corrigirTexto(value.sigla)} - ${corrigirTexto(value.nome)}`;
  }

  if (value.codigo && value.nome) {
    return corrigirTexto(value.nome);
  }

  if (value.codigo && value.descricao) {
    return corrigirTexto(value.descricao);
  }

  if (value.nome) {
    return traduzirValor(value.nome);
  }

  if (value.descricao) {
    return traduzirValor(value.descricao);
  }

  if (value.valor) {
    return formatarTexto(value.valor);
  }

  if (value.codigo) {
    return `Referência ${value.codigo}`;
  }

  return Object.entries(value)
    .map(([key, item]) => `${humanizarChave(key)}: ${formatarTexto(item)}`)
    .join("; ");
}

export function humanizarChave(key) {
  const mapa = {
    numeroProcesso: "Número do processo",
    classe: "Classe processual",
    classeProcessual: "Classe processual",
    sistema: "Sistema de origem",
    sistemaOrigem: "Sistema de origem",
    formato: "Formato",
    dataAjuizamento: "Data de ajuizamento",
    dataHoraUltimaAtualizacao: "Última atualização",
    nivelSigilo: "Nível de sigilo",
    orgaoJulgador: "Órgão julgador",
    assuntos: "Assuntos",
    assunto: "Assunto",
    movimentos: "Andamentos processuais",
    movimentacoes: "Andamentos processuais",
    grau: "Grau de jurisdição",
    grauProcesso: "Grau de jurisdição",
    tribunal: "Tribunal",
    codigo: "Referência",
    nome: "Nome",
    descricao: "Descrição",
    id: "Identificador interno",
    index: "Base consultada",
    score: "Relevância da consulta",
    timestamp: "Data técnica de atualização",
    processoEletronico: "Processo eletrônico"
  };

  if (mapa[key]) {
    return mapa[key];
  }

  return corrigirTexto(
    String(key)
      .replace(/^@/, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export function extrairAssuntos(source) {
  const assuntos = source?.assuntos || source?.assunto || [];

  if (!Array.isArray(assuntos)) {
    return assuntos ? [extrairNome(assuntos)] : [];
  }

  return assuntos.map(extrairNome).filter(Boolean);
}

export function extrairMovimentos(source) {
  const movimentos = source?.movimentos || source?.movimentacoes || [];

  if (!Array.isArray(movimentos)) {
    return [];
  }

  return [...movimentos].sort((a, b) => {
    const dateA = new Date(a?.dataHora || a?.data || 0).getTime();
    const dateB = new Date(b?.dataHora || b?.data || 0).getTime();
    return dateB - dateA;
  });
}

export function getClasse(source) {
  return extrairNome(source?.classe || source?.classeProcessual);
}

export function getOrgaoJulgador(source) {
  return extrairNome(source?.orgaoJulgador);
}

export function getSistema(source) {
  return formatarTexto(source?.sistema || source?.sistemaOrigem);
}

export function getFormato(source) {
  if (source?.formato?.nome) {
    return corrigirTexto(source.formato.nome);
  }

  if (source?.formato) {
    return formatarTexto(source.formato);
  }

  if (source?.processoEletronico === true) {
    return "Eletrônico";
  }

  if (source?.processoEletronico === false) {
    return "Físico";
  }

  return "Não informado";
}

export function getGrau(source) {
  return formatarTexto(source?.grau || source?.grauProcesso);
}

export function getNivelSigilo(source) {
  const valor = source?.nivelSigilo;

  if (valor === 0 || valor === "0") {
    return "Público";
  }

  return formatarTexto(valor);
}