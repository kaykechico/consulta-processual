function contarMojibake(texto) {
  const matches = String(texto).match(/Ã.|Â.|â€.|â€“|â€”|â€¦|ï¿½|�/g);
  return matches ? matches.length : 0;
}

function aplicarMapaSeguro(texto) {
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
  }, texto);
}

function tentarLatin1ParaUtf8(texto) {
  try {
    const convertido = Buffer.from(texto, "latin1").toString("utf8");
    const problemasAntes = contarMojibake(texto);
    const problemasDepois = contarMojibake(convertido);

    if (problemasAntes > 0 && problemasDepois < problemasAntes) {
      return convertido;
    }

    return texto;
  } catch {
    return texto;
  }
}

export function normalizarTexto(texto) {
  if (typeof texto !== "string") {
    return texto;
  }

  const original = texto;
  const primeiraPassagem = aplicarMapaSeguro(original);
  const segundaPassagem = tentarLatin1ParaUtf8(primeiraPassagem);
  const terceiraPassagem = aplicarMapaSeguro(segundaPassagem);

  return terceiraPassagem.normalize("NFC").trim();
}

export function normalizarObjeto(value) {
  if (typeof value === "string") {
    return normalizarTexto(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizarObjeto(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizarObjeto(item)])
    );
  }

  return value;
}