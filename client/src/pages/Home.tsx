import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scale } from "lucide-react";
import SearchForm from "../components/SearchForm";
import { useRecentes } from "../hooks/useRecentes";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const { recentes, remover, limpar } = useRecentes();

  const handleBuscar = useCallback(
    (numero: string) => {
      navigate(`/consulta?numero=${encodeURIComponent(numero)}`);
    },
    [navigate]
  );

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <Scale className={styles.icono} size={32} strokeWidth={1.5} aria-hidden="true" />
        <h1 className={styles.titulo}>Consulta Processual</h1>
        <p className={styles.subtitulo}>
          Consulte processos de todos os tribunais do Brasil em um só lugar.
        </p>
      </div>

      <div className={styles.formWrapper}>
        <SearchForm onBuscar={handleBuscar} carregando={false} />
      </div>

      {recentes.length > 0 && (
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

      <footer className={styles.rodape}>
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos de uso</Link>
        <Link to="/aviso">Aviso legal</Link>
      </footer>
    </main>
  );
}
