import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import SearchForm from "../components/SearchForm";
import Skeleton from "../components/Skeleton";
import { useProcesso } from "../hooks/useProcesso";
import { useRecentes } from "../hooks/useRecentes";
import { formatarMascara } from "../utils/mascara";
import styles from "./Home.module.css";

const ProcessResult = lazy(() => import("../components/ProcessResult"));

export default function Home() {
  const { estado, buscar, reset } = useProcesso();
  const { recentes, adicionar, remover, limpar } = useRecentes();
  const [ultimaBusca, setUltimaBusca] = useState<string | null>(null);

  const handleBuscar = useCallback(
    (numero: string) => {
      setUltimaBusca(numero);
      void buscar(numero);
    },
    [buscar],
  );

  useEffect(() => {
    if (estado.tipo === "sucesso" && ultimaBusca) {
      adicionar(ultimaBusca, formatarMascara(ultimaBusca));
    }
  }, [estado, ultimaBusca, adicionar]);

  const naTelaInicial = estado.tipo === "idle";
  const mostrarVoltar = estado.tipo === "sucesso" || estado.tipo === "erro";

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <Scale className={styles.icono} size={32} strokeWidth={1.5} aria-hidden="true" />
        <h1 className={styles.titulo}>Consulta Processual</h1>
        <p className={styles.subtitulo}>Consulte processos de todos os tribunais do Brasil em um só lugar.</p>
      </div>

      <div className={styles.formWrapper}>
        <SearchForm onBuscar={handleBuscar} carregando={estado.tipo === "carregando"} />
      </div>

      {naTelaInicial && recentes.length > 0 && (
        <section className={styles.recentes} aria-labelledby="recentes-titulo">
          <div className={styles.recentesCabecalho}>
            <h2 id="recentes-titulo" className={styles.recentesTitulo}>
              Consultas recentes
            </h2>
            <button className={styles.limparTudo} onClick={limpar}>
              Limpar todas
            </button>
          </div>
          <ul className={styles.recenteLista}>
            {recentes.map((r) => (
              <li key={r.numero} className={styles.recenteItem}>
                <button
                  className={styles.recenteBotao}
                  onClick={() => handleBuscar(r.numero)}
                  title={`Consultar ${r.rotulo}`}
                >
                  {r.rotulo}
                </button>
                <button
                  className={styles.recenteExcluir}
                  onClick={() => remover(r.numero)}
                  aria-label={`Excluir consulta ${r.rotulo}`}
                  title="Excluir"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mostrarVoltar && (
        <button className={styles.voltar} onClick={reset}>
          ← Voltar
        </button>
      )}

      <div className={styles.resultado} aria-live="polite">
        {estado.tipo === "carregando" && <Skeleton />}

        {estado.tipo === "erro" && (
          <p className={styles.mensagem} role="alert">
            {estado.mensagem}
          </p>
        )}

        {estado.tipo === "vazio" && (
          <p className={styles.mensagem}>
            Nenhum processo encontrado para o número{" "}
            <strong>{formatarMascara(ultimaBusca ?? "")}</strong>. Verifique o número e tente
            novamente.
          </p>
        )}

        {estado.tipo === "sucesso" && (
          <Suspense fallback={<Skeleton />}>
            <ProcessResult processo={estado.processo} />
          </Suspense>
        )}
      </div>
    </main>
  );
}