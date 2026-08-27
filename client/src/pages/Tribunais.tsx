import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ExternalLink } from "lucide-react";
import { TRIBUNAIS, type TipoJustica, type Tribunal } from "@consulta/shared";
import styles from "./Tribunais.module.css";

const ROTULO_JUSTICA: Record<TipoJustica, string> = {
  supremo: "Supremo Tribunal Federal",
  superior: "Tribunais Superiores",
  federal: "Justiça Federal (TRFs)",
  trabalho: "Justiça do Trabalho (TRTs / TST)",
  eleitoral: "Justiça Eleitoral (TREs / TSE)",
  militar: "Justiça Militar da União",
  estadual: "Justiça Estadual (TJs)",
  militar_estadual: "Justiça Militar Estadual (TJMs)",
};

const ORDEM_JUSTICAS: TipoJustica[] = [
  "supremo",
  "superior",
  "federal",
  "trabalho",
  "eleitoral",
  "estadual",
  "militar_estadual",
  "militar",
];

export default function Tribunais() {
  const [busca, setBusca] = useState("");
  const [segmentoFiltro, setSegmentoFiltro] = useState<string>("TODOS");

  const tribunaisFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return TRIBUNAIS.filter((t) => {
      if (segmentoFiltro !== "TODOS" && t.justica !== segmentoFiltro) {
        return false;
      }
      if (!q) return true;
      return (
        t.nome.toLowerCase().includes(q) ||
        t.alias.toLowerCase().includes(q) ||
        t.codigo.includes(q)
      );
    });
  }, [busca, segmentoFiltro]);

  const agrupados = useMemo(() => {
    const grupos = new Map<TipoJustica, Tribunal[]>();
    for (const j of ORDEM_JUSTICAS) {
      grupos.set(j, []);
    }
    for (const t of tribunaisFiltrados) {
      const lista = grupos.get(t.justica);
      if (lista) {
        lista.push(t);
      } else {
        grupos.set(t.justica, [t]);
      }
    }
    return Array.from(grupos.entries()).filter(([, itens]) => itens.length > 0);
  }, [tribunaisFiltrados]);

  return (
    <main className={styles.container}>
      <header className={styles.cabecalho}>
        <Link to="/" className={styles.voltar} aria-label="Voltar para a página inicial">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Voltar para a consulta</span>
        </Link>
        <h1 className={styles.titulo}>Tribunais Disponíveis</h1>
        <p className={styles.subtitulo}>
          Consulte a lista completa de tribunais mapeados pela numeração única do CNJ e verifique o
          status de integração na API Pública do DataJud.
        </p>
      </header>

      <section className={styles.filtros} aria-label="Filtros de tribunais">
        <div className={styles.buscaWrapper}>
          <Search size={16} className={styles.buscaIcon} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por nome, sigla ou UF (ex: TJSP, TRF1, São Paulo)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={styles.buscaInput}
            aria-label="Buscar tribunal"
          />
        </div>

        <select
          value={segmentoFiltro}
          onChange={(e) => setSegmentoFiltro(e.target.value)}
          className={styles.selectSegmento}
          aria-label="Filtrar por justiça"
        >
          <option value="TODOS">Todas as Justiças</option>
          {ORDEM_JUSTICAS.map((j) => (
            <option key={j} value={j}>
              {ROTULO_JUSTICA[j]}
            </option>
          ))}
        </select>
      </section>

      {agrupados.length === 0 ? (
        <p className={styles.vazio}>Nenhum tribunal encontrado para a busca informada.</p>
      ) : (
        <div className={styles.listaGrupos}>
          {agrupados.map(([justica, lista]) => (
            <section key={justica} aria-label={ROTULO_JUSTICA[justica]}>
              <h2 className={styles.grupoTitulo}>
                <span>{ROTULO_JUSTICA[justica]}</span>
                <span className={styles.grupoContagem}>
                  {lista.length} {lista.length === 1 ? "tribunal" : "tribunais"}
                </span>
              </h2>

              <div className={styles.gradeTribunais}>
                {lista.map((trib) => (
                  <article
                    key={`${trib.segmento}-${trib.codigo}-${trib.alias}`}
                    className={styles.card}
                  >
                    <div className={styles.cardCabecalho}>
                      <span className={styles.aliasBadge}>{trib.alias.toUpperCase()}</span>
                      {trib.suportadoDatajud === false && (
                        <span className={styles.badgeNaoSuportado}>Não suportado no DataJud</span>
                      )}
                    </div>

                    <h3 className={styles.cardNome}>{trib.nome}</h3>

                    <div className={styles.cardMeta}>
                      <span>Segmento {trib.segmento}</span>
                      <span>·</span>
                      <span>Código {trib.codigo}</span>
                    </div>

                    {trib.fonteOficial && (
                      <a
                        href={trib.fonteOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.linkFonte}
                        aria-label={`Consultar fonte oficial do ${trib.nome}`}
                      >
                        <span>Fonte oficial</span>
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
