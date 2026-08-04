import type { ReactNode } from "react";
import type { MovimentoDTO, ProcessoDTO } from "../types/processo";
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

const RE_AUDIENCIA = /audi|julgamento|senten|decis/i;
const RE_DOCUMENTO = /documento|certid|expedi|intima|public/i;
const RE_RECURSO = /recurso|apela|embarg|agravo|revis/i;

function grupoMovimento(nome: string): "audiencias" | "documentos" | "recursos" | "outros" {
  if (RE_RECURSO.test(nome)) return "recursos";
  if (RE_AUDIENCIA.test(nome)) return "audiencias";
  if (RE_DOCUMENTO.test(nome)) return "documentos";
  return "outros";
}

const GRUPOS = [
  { chave: "audiencias", titulo: "Audiências e Julgamentos" },
  { chave: "documentos", titulo: "Documentos" },
  { chave: "recursos", titulo: "Recursos" },
  { chave: "outros", titulo: "Movimentações" },
] as const;

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

function Timeline({ movimentos }: { movimentos: MovimentoDTO[] }) {
  return (
    <ol className={styles.timeline}>
      {movimentos.map((m, i) => (
        <li key={i} className={styles.movimento}>
          <span className={styles.movimentoData}>{formatarData(m.dataHora)}</span>
          <span className={styles.movimentoNome}>{m.nome}</span>
          {m.complementos.length > 0 && (
            <span className={styles.movimentoComplemento}>
              {m.complementos.join(" · ")}
            </span>
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
    <section
      className={styles.secao}
      aria-label={titulo}
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className={styles.secaoTitulo}>{titulo}</h3>
      {children}
    </section>
  );
}

export default function ProcessResult({ processo }: { processo: ProcessoDTO }) {
  const ministerios = processo.partes.filter((p) => p.isMinisterioPublico);
  const demaisPartes = processo.partes.filter((p) => !p.isMinisterioPublico);

  const grupos = new Map<string, MovimentoDTO[]>();
  for (const g of GRUPOS) grupos.set(g.chave, []);
  for (const m of processo.movimentos) {
    grupos.get(grupoMovimento(m.nome))!.push(m);
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
        {processo.situacao && <span className={styles.badge}>{processo.situacao}</span>}
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
              <span key={a.codigo} className={styles.chip}>
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
                  {p.documento && <span className={styles.parteDoc}>{p.documento}</span>}
                </div>
                {p.tipo && <span className={styles.parteTipo}>{p.tipo}</span>}
                {p.advogados.length > 0 && (
                  <span className={styles.parteDetalhe}>
                    Advogados: {p.advogados.join(", ")}
                  </span>
                )}
                {p.representantes.length > 0 && (
                  <span className={styles.parteDetalhe}>
                    Representantes: {p.representantes.join(", ")}
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
                {p.tipo && <span className={styles.parteTipo}>{p.tipo}</span>}
              </div>
            ))}
          </div>
        </Secao>
      )}

      {GRUPOS.map((g) => {
        const movimentos = grupos.get(g.chave)!;
        if (movimentos.length === 0) return null;
        return (
          <Secao key={g.chave} titulo={g.titulo} delay={proximoAtraso()}>
            <Timeline movimentos={movimentos} />
          </Secao>
        );
      })}
    </article>
  );
}
