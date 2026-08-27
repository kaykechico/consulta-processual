import { useMemo, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Share2, MoreHorizontal, Copy, FileText, Printer, Check, ExternalLink } from "lucide-react";
import type { Processo, CategoriaMovimento } from "@consulta/shared";
import { ROTULO_CATEGORIA, classificarMovimento, getTribunalFromCNJ } from "@consulta/shared";
import {
  filtrarMovimentos,
  calcularContagens,
  isIntervaloInvalido,
} from "../utils/movimentoFiltros";
import styles from "./ProcessResult.module.css";

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const formatoValor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarNumero(valor?: number): string {
  if (valor === undefined || Number.isNaN(valor)) return "";
  return formatoValor.format(valor);
}

function formatarData(valor?: string): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return formatoData.format(d);
}

const ORDEM_CATEGORIAS: CategoriaMovimento[] = [
  "AUDIENCIA",
  "SENTENCA",
  "DECISAO",
  "RECURSO",
  "DOCUMENTO",
  "INTIMACAO",
  "DISTRIBUICAO",
  "OUTROS",
];

const MOVIMENTOS_POR_PAGINA = 50;

type Movimento = Processo["movimentos"][number];

function chaveMovimento(movimento: Movimento, indice: number): string {
  return movimento.codigo
    ? `${movimento.codigo}-${movimento.dataHora ?? indice}`
    : `${movimento.nome}-${movimento.dataHora ?? indice}`;
}

interface ItemProps {
  rotulo: string;
  valor?: string | number;
}

function Item({ rotulo, valor }: ItemProps) {
  if (valor === undefined || valor === "" || valor === null) return null;
  return (
    <div className={styles.item}>
      <dt className={styles.rotulo}>{rotulo}</dt>
      <dd className={styles.valor}>{valor}</dd>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className={styles.secao} aria-label={titulo}>
      <h3 className={styles.secaoTitulo}>{titulo}</h3>
      {children}
    </section>
  );
}

function listaAdvogados(advogados: { nome: string; numeroOAB?: string }[]): string {
  return advogados.map((a) => (a.numeroOAB ? `${a.nome} (OAB ${a.numeroOAB})` : a.nome)).join(", ");
}

export default function ProcessResult({ processo }: { processo: Processo }) {
  const ministerios = processo.partes.filter((p) => p.isMinisterioPublico);
  const demaisPartes = processo.partes.filter((p) => !p.isMinisterioPublico);

  const [filtro, setFiltro] = useState<CategoriaMovimento | "TODOS">("TODOS");
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [ordem, setOrdem] = useState<"recente" | "antigo">("recente");
  const [paginaMovimentos, setPaginaMovimentos] = useState(1);
  const [copiado, setCopiado] = useState<"url" | "resumo" | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const botaoMenuRef = useRef<HTMLButtonElement>(null);
  const timerCopiadoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tribunalInfo = useMemo(
    () => getTribunalFromCNJ(processo.numeroProcesso),
    [processo.numeroProcesso]
  );

  const contagens = useMemo(() => calcularContagens(processo.movimentos), [processo.movimentos]);

  const movimentosFiltrados = useMemo(() => {
    return filtrarMovimentos(processo.movimentos, {
      categoria: filtro,
      busca,
      dataInicio,
      dataFim,
      ordem,
    });
  }, [processo.movimentos, filtro, busca, dataInicio, dataFim, ordem]);

  const movimentosVisiveis = useMemo(
    () => movimentosFiltrados.slice(0, paginaMovimentos * MOVIMENTOS_POR_PAGINA),
    [movimentosFiltrados, paginaMovimentos]
  );

  const intervaloInvertido = useMemo(
    () => isIntervaloInvalido(dataInicio, dataFim),
    [dataInicio, dataFim]
  );

  useEffect(() => {
    setPaginaMovimentos(1);
  }, [filtro, busca, dataInicio, dataFim, ordem]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuAberto(false);
        botaoMenuRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (timerCopiadoRef.current) clearTimeout(timerCopiadoRef.current);
    };
  }, []);

  const copiar = async (texto: string, tipo?: "url" | "resumo") => {
    try {
      await navigator.clipboard.writeText(texto);
      if (tipo) {
        setCopiado(tipo);
        if (timerCopiadoRef.current) clearTimeout(timerCopiadoRef.current);
        timerCopiadoRef.current = setTimeout(
          () => setCopiado((atual) => (atual === tipo ? null : atual)),
          2000
        );
      }
    } catch {
      void 0;
    }
  };

  const compartilhar = async () => {
    const url = window.location.href;
    const dados = {
      title: `Processo ${processo.numeroProcesso}`,
      text: `Consulta ${processo.numeroProcesso} via DataJud`,
      url,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(dados);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copiar(url, "url");
  };

  const copiarResumo = () => {
    const resumo = [
      `Processo: ${processo.numeroProcesso}`,
      `Tribunal: ${processo.tribunal}`,
      `Classe: ${processo.classe?.nome ?? "-"}`,
      `Assuntos: ${processo.assuntos.map((a) => a.nome).join(", ") || "-"}`,
      `Último movimento: ${processo.ultimaMovimentacao?.nome ?? "-"}`,
      `Data: ${formatarData(processo.ultimaMovimentacao?.dataHora)}`,
      `Fonte: CNJ / DataJud`,
    ].join("\n");
    void copiar(resumo, "resumo");
  };

  return (
    <article className={styles.documento}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoInfo}>
          <div className={styles.numeroWrapper}>
            <h2 className={styles.numero}>{processo.numeroProcesso}</h2>
            <button
              type="button"
              onClick={() => void copiar(processo.numeroProcesso, "url")}
              className={styles.botaoCopiarNumero}
              aria-label="Copiar número do processo"
              title="Copiar número do processo"
            >
              <Copy size={16} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.meta}>
            <span>{processo.tribunal}</span>
            {processo.instancia && (
              <span className={styles.badgeInstancia}>{processo.instancia}</span>
            )}
            {processo.competencia && <span>· {processo.competencia}</span>}
            {typeof processo.nivelSigilo === "number" && processo.nivelSigilo > 0 && (
              <span className={styles.badgeSigilo}>Segredo de Justiça</span>
            )}
          </div>
          {tribunalInfo?.fonteOficial && (
            <a
              href={tribunalInfo.fonteOficial}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkFonteTribunal}
              aria-label={`Consultar processo na fonte oficial do ${processo.tribunal}`}
            >
              <span>Consultar no tribunal</span>
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
        </div>

        <div className={styles.acoes} ref={menuRef}>
          <button
            onClick={compartilhar}
            className={styles.botaoPrincipal}
            aria-label="Compartilhar"
          >
            <Share2 size={15} aria-hidden="true" />
            <span>Compartilhar</span>
          </button>

          <button
            ref={botaoMenuRef}
            onClick={() => setMenuAberto((v) => !v)}
            className={styles.botaoMenu}
            aria-label="Mais ações"
            aria-expanded={menuAberto}
            aria-controls="acoes-menu"
          >
            <MoreHorizontal size={17} aria-hidden="true" />
          </button>

          {menuAberto && (
            <div id="acoes-menu" className={styles.menuDropdown} role="menu">
              <button
                role="menuitem"
                onClick={() => {
                  void copiar(window.location.href, "url");
                  setMenuAberto(false);
                  botaoMenuRef.current?.focus();
                }}
                className={`${styles.menuItem} ${copiado === "url" ? styles.menuItemSucesso : ""}`}
                aria-label="Copiar URL"
              >
                {copiado === "url" ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiado === "url" ? "URL copiada" : "Copiar URL"}</span>
              </button>

              <button
                role="menuitem"
                onClick={() => {
                  copiarResumo();
                  setMenuAberto(false);
                  botaoMenuRef.current?.focus();
                }}
                className={`${styles.menuItem} ${copiado === "resumo" ? styles.menuItemSucesso : ""}`}
                aria-label="Copiar resumo"
              >
                {copiado === "resumo" ? <Check size={14} /> : <FileText size={14} />}
                <span>{copiado === "resumo" ? "Resumo copiado" : "Copiar resumo"}</span>
              </button>

              <button
                role="menuitem"
                onClick={() => {
                  window.print();
                  setMenuAberto(false);
                  botaoMenuRef.current?.focus();
                }}
                className={styles.menuItem}
                aria-label="Imprimir processo"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
            </div>
          )}
          <span className="srOnly" aria-live="polite" aria-atomic="true">
            {copiado === "url" && "URL copiada."}
            {copiado === "resumo" && "Resumo copiado."}
          </span>
        </div>
      </header>

      <section className={styles.destaqueResumo} aria-label="Última movimentação">
        <div className={styles.resumoCabecalho}>
          <span className={styles.resumoRotulo}>Última movimentação</span>
          {processo.ultimaMovimentacao?.categoria && (
            <span className={styles.badge}>{processo.ultimaMovimentacao.categoria}</span>
          )}
        </div>
        <h3 className={styles.resumoEvento}>{processo.ultimaMovimentacao?.nome ?? "-"}</h3>
        <p className={styles.resumoData}>
          {formatarData(processo.ultimaMovimentacao?.dataHora)}
          {processo.dataHoraUltimaAtualizacao && (
            <span>
              {" "}
              · Atualizado no DataJud em {formatarData(processo.dataHoraUltimaAtualizacao)}
            </span>
          )}
        </p>
      </section>

      <Secao titulo="Processo">
        <dl className={styles.grade}>
          <Item rotulo="Classe" valor={processo.classe?.nome} />
          <Item rotulo="Valor da causa" valor={formatarNumero(processo.valorCausa)} />
          <Item rotulo="Órgão julgador" valor={processo.orgaoJulgador?.nome} />
          <Item rotulo="Sistema" valor={processo.sistema?.nome} />
          <Item rotulo="Formato" valor={processo.formato?.nome} />
          <Item rotulo="Nível de sigilo" valor={processo.nivelSigilo} />
          {processo.datasRelevantes.map((d) => (
            <Item key={d.rotulo} rotulo={d.rotulo} valor={formatarData(d.valor)} />
          ))}
        </dl>
        {processo.assuntos.length > 0 && (
          <div className={styles.chips}>
            {processo.assuntos.map((a) => (
              <span key={a.codigo ?? a.nome} className={styles.chip}>
                {a.nome}
              </span>
            ))}
          </div>
        )}
      </Secao>

      {demaisPartes.length > 0 && (
        <Secao titulo="Partes">
          <div className={styles.listaPartes}>
            {demaisPartes.map((p, i) => (
              <div key={p.nome ? `${p.nome}-${i}` : i} className={styles.parteCard}>
                <div className={styles.parteLinha}>
                  <span className={styles.parteNome}>{p.nome}</span>
                  {p.tipoParte && <span className={styles.parteTipo}>{p.tipoParte}</span>}
                </div>
                {p.tipoPessoa && <span className={styles.parteDoc}>{p.tipoPessoa}</span>}
                {p.advogados.length > 0 && (
                  <span className={styles.parteDetalhe}>
                    Advogados: {listaAdvogados(p.advogados)}
                  </span>
                )}
                {p.representantes.length > 0 && (
                  <span className={styles.parteDetalhe}>
                    Representantes: {p.representantes.map((r) => r.nome).join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Secao>
      )}

      {ministerios.length > 0 && (
        <Secao titulo="Ministério Público">
          <div className={styles.listaPartes}>
            {ministerios.map((p, i) => (
              <div key={p.nome ? `${p.nome}-${i}` : i} className={styles.parteCard}>
                <div className={styles.parteLinha}>
                  <span className={styles.parteNome}>{p.nome}</span>
                  {p.tipoParte && <span className={styles.parteTipo}>{p.tipoParte}</span>}
                </div>
              </div>
            ))}
          </div>
        </Secao>
      )}

      <Secao titulo={`Movimentações (${movimentosFiltrados.length})`}>
        <div className={styles.contagensCategorias} aria-label="Contagem por categorias">
          {ORDEM_CATEGORIAS.filter((c) => contagens[c] > 0).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFiltro((atual) => (atual === c ? "TODOS" : c))}
              className={`${styles.pillCategoria} ${filtro === c ? styles.pillCategoriaAtiva : ""}`}
              aria-pressed={filtro === c}
            >
              <span>{ROTULO_CATEGORIA[c]}</span>
              <span className={styles.pillBadge}>{contagens[c]}</span>
            </button>
          ))}
        </div>

        <div className={styles.filtrosTimeline}>
          <input
            placeholder="Buscar na timeline..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar na timeline"
            className={styles.filtroInput}
          />
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as CategoriaMovimento | "TODOS")}
            aria-label="Filtrar por categoria"
            className={styles.filtroSelect}
          >
            <option value="TODOS">Todas as categorias</option>
            {ORDEM_CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {ROTULO_CATEGORIA[categoria]}
              </option>
            ))}
          </select>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as "recente" | "antigo")}
            aria-label="Ordenação"
            className={styles.filtroSelect}
          >
            <option value="recente">Mais recentes primeiro</option>
            <option value="antigo">Mais antigos primeiro</option>
          </select>
          <div className={styles.filtrosDataWrapper}>
            <div className={styles.filtroDataCampo}>
              <label className={styles.filtroDataLabel} htmlFor="filtro-data-inicio">
                De:
              </label>
              <input
                id="filtro-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                aria-label="Data inicial"
                className={styles.filtroDataInput}
              />
            </div>
            <div className={styles.filtroDataCampo}>
              <label className={styles.filtroDataLabel} htmlFor="filtro-data-fim">
                Até:
              </label>
              <input
                id="filtro-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                aria-label="Data final"
                className={styles.filtroDataInput}
              />
            </div>
          </div>
        </div>

        {intervaloInvertido ? (
          <p className={styles.avisoErroFiltro} role="alert">
            A data inicial não pode ser posterior à data final.
          </p>
        ) : movimentosFiltrados.length === 0 ? (
          <p className={styles.avisoVazio}>
            {processo.movimentos.length === 0
              ? "Este processo não possui movimentações públicas cadastradas no DataJud."
              : "Nenhuma movimentação encontrada para o filtro aplicado."}
          </p>
        ) : (
          <ol className={styles.timeline}>
            {movimentosVisiveis.map((m, i) => (
              <li
                key={chaveMovimento(m, i)}
                className={`${styles.movimento} ${(ordem === "recente" ? i === 0 : i === movimentosFiltrados.length - 1) ? styles.movimentoRecente : ""}`}
              >
                <span className={styles.movimentoData}>
                  {formatarData(m.dataHora)} {m.codigo ? `· ${m.codigo}` : ""} ·{" "}
                  {classificarMovimento(m)}
                </span>
                <span className={styles.movimentoNome}>{m.nome}</span>
                {m.orgaoJulgador?.nome && (
                  <span className={styles.movimentoOrgao}>{m.orgaoJulgador.nome}</span>
                )}
                {m.complementos.length > 0 && (
                  <span className={styles.movimentoComplemento}>{m.complementos.join(" · ")}</span>
                )}
              </li>
            ))}
          </ol>
        )}

        {movimentosVisiveis.length < movimentosFiltrados.length && (
          <>
            <p className={styles.contagemMovimentos} aria-live="polite">
              Exibindo {movimentosVisiveis.length} de {movimentosFiltrados.length} movimentações.
            </p>
            <button
              type="button"
              className={styles.carregarMais}
              onClick={() => setPaginaMovimentos((pagina) => pagina + 1)}
            >
              Carregar mais movimentações
            </button>
          </>
        )}

        <details className={styles.agrupamento}>
          <summary className={styles.agrupamentoSumario}>Ver agrupado por categoria</summary>
          <div className={styles.agrupamentoConteudo}>
            {ORDEM_CATEGORIAS.map((cat) => {
              const grupos = movimentosFiltrados.filter((m) => classificarMovimento(m) === cat);
              if (grupos.length === 0) return null;
              return (
                <div key={cat} className={styles.grupoCat}>
                  <h4 className={styles.grupoTitulo}>
                    {ROTULO_CATEGORIA[cat]} ({grupos.length})
                  </h4>
                  <ol className={styles.timeline}>
                    {grupos.slice(0, 5).map((m, i) => (
                      <li key={chaveMovimento(m, i)} className={styles.movimento}>
                        <span className={styles.movimentoData}>{formatarData(m.dataHora)}</span>
                        <span className={styles.movimentoNome}>{m.nome}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </details>

        <p className={styles.fonteDados}>
          Fonte dos dados: CNJ / DataJud. Esta aplicação é informativa e não substitui a fonte
          oficial.
        </p>
      </Secao>
    </article>
  );
}
