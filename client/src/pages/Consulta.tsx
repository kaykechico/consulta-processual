import { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SearchForm from "../components/SearchForm";
import Skeleton from "../components/Skeleton";
import { useProcesso } from "../hooks/useProcesso";
import { useRecentes } from "../hooks/useRecentes";
import { apenasDigitos, formatCNJ } from "@consulta/shared";
import styles from "./Consulta.module.css";

const ProcessResult = lazy(() => import("../components/ProcessResult"));

export default function Consulta() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawNumero = searchParams.get("numero") ?? "";
  const numero = apenasDigitos(rawNumero);
  const { estado, buscar, reset } = useProcesso();
  const { adicionar } = useRecentes();
  const resultadoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const original = meta?.getAttribute("content") ?? "index, follow";
    if (meta) meta.setAttribute("content", "noindex, nofollow");
    return () => {
      if (meta) meta.setAttribute("content", original);
    };
  }, []);

  useEffect(() => {
    if (!rawNumero.trim()) {
      navigate("/", { replace: true });
    } else if (numero.length === 20) {
      void buscar(numero);
    }
  }, [rawNumero, numero, buscar, navigate]);

  useEffect(() => {
    if (estado.tipo === "sucesso" && numero.length === 20) {
      adicionar(numero, formatCNJ(numero));
    }
  }, [estado, numero, adicionar]);

  useEffect(() => {
    if (estado.tipo !== "idle" && estado.tipo !== "carregando") {
      resultadoRef.current?.focus();
    }
  }, [estado.tipo]);

  const handleBuscar = useCallback(
    (valor: string) => {
      const digitos = apenasDigitos(valor);
      if (digitos !== numero) {
        setSearchParams({ numero: digitos });
      } else {
        void buscar(digitos);
      }
    },
    [numero, setSearchParams, buscar]
  );

  const voltar = useCallback(() => {
    reset();
    navigate("/");
  }, [reset, navigate]);

  const carregando = estado.tipo === "carregando";
  const numeroInvalido = rawNumero.trim().length > 0 && numero.length !== 20;

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            className={styles.voltar}
            onClick={voltar}
            aria-label="Voltar para a página inicial"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar</span>
          </button>
          <div className={styles.headerSearch}>
            <SearchForm
              onBuscar={handleBuscar}
              carregando={carregando}
              valorInicial={numero}
              compact={true}
            />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className="srOnly" aria-live="polite" aria-atomic="true">
          {carregando && "Consultando processo."}
          {estado.tipo === "sucesso" && "Consulta concluída."}
          {estado.tipo === "vazio" && "Processo não encontrado."}
          {estado.tipo === "erro" && "A consulta encontrou um erro."}
        </div>

        <div ref={resultadoRef} tabIndex={-1}>
          {numeroInvalido && (
            <div className={styles.mensagemErro} role="alert">
              <h2 className={styles.mensagemTitulo}>Número de processo inválido</h2>
              <p className={styles.mensagemDescricao}>
                O número informado na URL não contém 20 dígitos. Verifique o número CNJ e tente
                novamente.
              </p>
              <button className={styles.botaoTentar} onClick={voltar}>
                Voltar à página inicial
              </button>
            </div>
          )}

          {!numeroInvalido && carregando && <Skeleton />}

          {!numeroInvalido && estado.tipo === "erro" && (
            <div className={styles.mensagemErro} role="alert">
              <h2 className={styles.mensagemTitulo}>Não foi possível consultar o processo</h2>
              <p className={styles.mensagemDescricao}>{estado.mensagem}</p>
              <button className={styles.botaoTentar} onClick={() => buscar(numero)}>
                Tentar novamente
              </button>
            </div>
          )}

          {!numeroInvalido && estado.tipo === "vazio" && (
            <div className={styles.mensagemVazio}>
              <h2 className={styles.mensagemTitulo}>Processo não encontrado</h2>
              <p className={styles.mensagemDescricao}>
                Nenhum processo foi localizado para o número <strong>{formatCNJ(numero)}</strong>.
                Verifique se o tribunal correspondente já integrou os autos no DataJud.
              </p>
              <button className={styles.botaoTentar} onClick={voltar}>
                Nova consulta
              </button>
            </div>
          )}

          {!numeroInvalido && estado.tipo === "sucesso" && (
            <Suspense fallback={<Skeleton />}>
              <ProcessResult processo={estado.processo} />
            </Suspense>
          )}
        </div>
      </main>
    </>
  );
}
