import { Suspense, lazy, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SearchForm from "../components/SearchForm";
import Skeleton from "../components/Skeleton";
import { useProcesso } from "../hooks/useProcesso";
import { useRecentes } from "../hooks/useRecentes";
import { formatarMascara } from "../utils/mascara";
import styles from "./Home.module.css";

const ProcessResult = lazy(() => import("../components/ProcessResult"));

export default function Consulta() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const numero = searchParams.get("numero") ?? "";
  const { estado, buscar, reset } = useProcesso();
  const { adicionar } = useRecentes();

  useEffect(() => {
    if (numero.length === 20) {
      void buscar(numero);
    }
  }, [numero, buscar]);

  useEffect(() => {
    if (estado.tipo === "sucesso") {
      adicionar(numero, formatarMascara(numero));
    }
  }, [estado, numero, adicionar]);

  const handleBuscar = useCallback(
    (valor: string) => {
      if (valor !== numero) {
        setSearchParams({ numero: valor });
      } else {
        void buscar(valor);
      }
    },
    [numero, setSearchParams, buscar]
  );

  const voltar = useCallback(() => {
    reset();
    navigate("/");
  }, [reset, navigate]);

  const carregando = estado.tipo === "carregando";
  const numeroInvalido = numero.length > 0 && numero.length !== 20;

  return (
    <main className={styles.main}>
      <button className={styles.voltar} onClick={voltar}>
        <ArrowLeft size={16} aria-hidden="true" /> Voltar
      </button>
      <div className={styles.formWrapper}>
        <SearchForm onBuscar={handleBuscar} carregando={carregando} valorInicial={numero} />
      </div>

      <div className={styles.resultado} aria-live="polite">
        {numeroInvalido && (
          <p className={styles.mensagem} role="alert">
            Número de processo inválido na URL. Informe um número CNJ completo.
          </p>
        )}

        {!numeroInvalido && carregando && <Skeleton />}

        {!numeroInvalido && estado.tipo === "erro" && (
          <p className={styles.mensagem} role="alert">
            {estado.mensagem}
          </p>
        )}

        {!numeroInvalido && estado.tipo === "vazio" && (
          <p className={styles.mensagem}>
            Nenhum processo encontrado para o número <strong>{formatarMascara(numero)}</strong>.
            Verifique o número e tente novamente.
          </p>
        )}

        {!numeroInvalido && estado.tipo === "sucesso" && (
          <Suspense fallback={<Skeleton />}>
            <ProcessResult processo={estado.processo} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
