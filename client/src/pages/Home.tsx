import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchForm from "../components/SearchForm";
import { useRecentes } from "../hooks/useRecentes";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const { recentes, remover, limpar, enabled, setEnabled } = useRecentes();

  const handleBuscar = useCallback(
    (numero: string) => {
      navigate(`/consulta?numero=${encodeURIComponent(numero)}`);
    },
    [navigate]
  );

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <h1 className={styles.titulo}>Consulta Processual</h1>
        <p className={styles.subtitulo}>
          Consulte processos pelo número CNJ nos tribunais disponíveis no DataJud.
        </p>
      </header>

      <div className={styles.formWrapper}>
        <SearchForm onBuscar={handleBuscar} carregando={false} />
      </div>

      <section className={styles.recentes} aria-labelledby="recentes-titulo">
        <div className={styles.recentesCabecalho}>
          <h2 id="recentes-titulo" className={styles.recentesTitulo}>
            Recentes
          </h2>
          <div className={styles.controlesHistorico}>
            <label className={styles.salvarToggle}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Salvar histórico
            </label>
            {recentes.length > 0 && (
              <button className={styles.limparTudo} onClick={limpar}>
                Limpar
              </button>
            )}
          </div>
        </div>

        {!enabled ? (
          <p className={styles.avisoHistorico}>
            Histórico desativado — as consultas não serão salvas neste navegador.
          </p>
        ) : recentes.length === 0 ? (
          <p className={styles.avisoHistorico}>
            Nenhuma consulta recente. O histórico é local e expira em 30 dias.
          </p>
        ) : (
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
        )}
      </section>

      <footer className={styles.rodape}>
        <Link to="/tribunais">Tribunais</Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacidade">Privacidade</Link>
        <span aria-hidden="true">·</span>
        <Link to="/termos">Termos</Link>
        <span aria-hidden="true">·</span>
        <Link to="/aviso">Aviso legal</Link>
        <span aria-hidden="true">·</span>
        <Link to="/sobre">Sobre</Link>
        <span aria-hidden="true">·</span>
        <Link to="/open-source">Open source</Link>
      </footer>
    </main>
  );
}
