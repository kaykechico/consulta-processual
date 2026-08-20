import type { ReactNode } from "react";
import type { Movimento, Processo } from "../../../shared/src/schemas";
import { ROTULO_CATEGORIA, classificarMovimento } from "../../../shared/src/movimentos";
import type { CategoriaMovimento } from "../../../shared/src/movimentos";
import styles from "./ProcessResult.module.css";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatoValor = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatarNumero(valor?: number): string {
  if (valor === undefined || Number.isNaN(valor)) return "";
  return formatoValor.format(valor);
}

function formatarData(valor?: string): string {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return formatoData.format(data);
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

function Timeline({ movimentos }: { movimentos: Movimento[] }) {
  return (
    <ol className={styles.timeline}>
      {movimentos.map((m, i) => (
        <li key={i} className={styles.movimento}>
          <span className={styles.movimentoData}>{formatarData(m.dataHora)}</span>
          <span className={styles.movimentoNome}>{m.nome}</span>
          {m.complementos.length > 0 && (
            <span className={styles.movimentoComplemento}>{m.complementos.join(" · ")}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

interface SecaoProps {
  titulo: string;
  children: ReactNode;
  delay?: number;
}

function Secao({ titulo, children, delay = 0 }: SecaoProps) {
  return (
    <section className={styles.secao} aria-label={titulo} style={{ animationDelay: `${delay}ms` }}>
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

  const grupos = new Map<CategoriaMovimento, Movimento[]>();
  for (const categoria of ORDEM_CATEGORIAS) grupos.set(categoria, []);
  for (const m of processo.movimentos) {
    grupos.get(classificarMovimento(m))!.push(m);
  }

  let indice = 0;
  const proximoAtraso = () => 40 + 60 * indice++;

  return (
    <article className={styles.card}>
      <header className={styles.cabecalho}>
        <div>
          <h2 className={styles.numero}>{processo.numeroProcesso}</h2>
          <p className={styles.meta}>
            {[processo.tribunal, processo.grau, processo.instancia, processo.competencia]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {processo.ultimaMovimentacao && (
          <span className={styles.badge}>{processo.ultimaMovimentacao.nome}</span>
        )}
      </header>

      <Secao titulo="Processo" delay={proximoAtraso()}>
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
        <Secao titulo="Partes" delay={proximoAtraso()}>
          <div className={styles.lista}>
            {demaisPartes.map((p, i) => (
              <div key={i} className={styles.parte}>
                <div className={styles.parteLinha}>
                  <span className={styles.parteNome}>{p.nome}</span>
                  {p.tipoPessoa && <span className={styles.parteDoc}>{p.tipoPessoa}</span>}
                </div>
                {p.tipoParte && <span className={styles.parteTipo}>{p.tipoParte}</span>}
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
        <Secao titulo="Ministério Público" delay={proximoAtraso()}>
          <div className={styles.lista}>
            {ministerios.map((p, i) => (
              <div key={i} className={styles.parte}>
                <span className={styles.parteNome}>{p.nome}</span>
                {p.tipoParte && <span className={styles.parteTipo}>{p.tipoParte}</span>}
              </div>
            ))}
          </div>
        </Secao>
      )}

      {ORDEM_CATEGORIAS.map((categoria) => {
        const movimentos = grupos.get(categoria)!;
        if (movimentos.length === 0) return null;
        return (
          <Secao key={categoria} titulo={ROTULO_CATEGORIA[categoria]} delay={proximoAtraso()}>
            <Timeline movimentos={movimentos} />
          </Secao>
        );
      })}
    </article>
  );
}
