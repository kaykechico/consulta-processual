import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, Scale } from "lucide-react";
import { consultarProcesso, verificarConexaoApi } from "./api/processos.api";
import SearchForm from "./components/SearchForm";
import RecentSearches from "./components/RecentSearches";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import {
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  saveRecentSearch
} from "./utils/recentSearches";
import { traduzirValor } from "./utils/processo";

const ProcessSummary = lazy(() => import("./components/ProcessSummary"));
const MovementsTimeline = lazy(() => import("./components/MovementsTimeline"));

export default function App() {
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ultimoNumero, setUltimoNumero] = useState("");
  const [recentes, setRecentes] = useState([]);
  const [apiOnline, setApiOnline] = useState(true);

  const consultaIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    setRecentes(getRecentSearches());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    verificarConexaoApi({ signal: controller.signal }).then((online) => {
      if (!controller.signal.aborted) {
        setApiOnline(online);
      }
    });

    return () => controller.abort();
  }, []);

  async function handleConsultar(numeroProcesso) {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const consultaId = consultaIdRef.current + 1;
    consultaIdRef.current = consultaId;

    setLoading(true);
    setErro(null);
    setResultado(null);
    setUltimoNumero(numeroProcesso);

    try {
      const data = await consultarProcesso(numeroProcesso, {
        signal: controller.signal
      });

      if (consultaId !== consultaIdRef.current) {
        return;
      }

      if (!data?.success) {
        setErro({
          error: data?.error || "ERRO_CONSULTA",
          message:
            data?.message || "A consulta processual não pôde ser concluída no momento."
        });
        return;
      }

      setResultado(data);
      setApiOnline(true);

      setRecentes(
        saveRecentSearch({
          numeroFormatado: data.numeroFormatado,
          numeroLimpo: data.numeroLimpo,
          tribunal: traduzirValor(data.tribunalDetectado || "")
        })
      );
    } catch (error) {
      if (consultaId !== consultaIdRef.current) {
        return;
      }

      const response = error?.response?.data;

      if (response?.error === "CONSULTA_CANCELADA") {
        return;
      }

      setErro({
        error: response?.error || "ERRO_CONSULTA",
        message:
          response?.message || "A consulta processual não pôde ser concluída no momento."
      });
    } finally {
      if (consultaId === consultaIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleSelecionarRecente(item) {
    if (item?.numeroFormatado) {
      handleConsultar(item.numeroFormatado);
    }
  }

  function handleRemoverRecente(numeroLimpo) {
    setRecentes(removeRecentSearch(numeroLimpo));
  }

  function handleLimparRecentes() {
    setRecentes(clearRecentSearches());
  }

  function novaConsulta() {
    abortControllerRef.current?.abort();
    consultaIdRef.current += 1;

    setResultado(null);
    setErro(null);
    setLoading(false);
    setUltimoNumero("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const modoResultado = Boolean(resultado?.success || erro || loading);

  return (
    <main className="app-shell relative min-h-[100dvh] overflow-x-hidden">
      {!modoResultado && (
        <section className="page-padding relative flex min-h-[100dvh] items-center justify-center py-8 sm:py-12">
          <div className="w-full max-w-[600px]">
            <div className="mb-9 sm:mb-10">
              <div className="mb-7 inline-flex items-center gap-2.5 text-sm font-medium text-slate-300">
                <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-lg">
                  <Scale size={18} />
                </span>
                Consulta Processual
              </div>

              <h1 className="display-title max-w-[520px] text-[clamp(2.35rem,7vw,3.55rem)] font-medium leading-[1.08] text-slate-100">
                Encontre um processo pelo número CNJ.
              </h1>

              <p className="mt-4 max-w-[470px] text-sm leading-6 text-slate-400">
                Consulte dados públicos disponíveis no DataJud de forma simples e direta.
              </p>
            </div>

            {!apiOnline && (
              <div
                role="status"
                className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-center text-xs font-medium leading-5 text-amber-100/90"
              >
                Servidor de consulta indisponível no momento. Verifique se o backend está em
                execução.
              </div>
            )}

            <SearchForm onSubmit={handleConsultar} loading={loading} />

            <RecentSearches
              items={recentes}
              onSelect={handleSelecionarRecente}
              onRemove={handleRemoverRecente}
              onClear={handleLimparRecentes}
            />
          </div>
        </section>
      )}

      {modoResultado && (
        <section className="page-padding relative mx-auto min-h-[100dvh] w-full max-w-[1020px] py-4 sm:py-8 lg:py-10">
          <header className="result-header sticky top-3 z-10 mb-5 rounded-xl px-4 py-3 backdrop-blur-xl sm:static sm:mb-7 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Processo consultado</p>
                <h1 className="mt-1 block break-all font-display text-[1.3rem] font-medium tracking-[-0.025em] text-slate-100 sm:text-[1.55rem]">
                  {resultado?.numeroFormatado || ultimoNumero}
                </h1>
                {resultado?.success && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Fonte: DataJud/CNJ
                    {resultado.buscaAmpla ? " - busca ampliada" : ""}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={novaConsulta}
                className="control inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-slate-300 sm:w-auto"
              >
                <ArrowLeft size={14} />
                Nova consulta
              </button>
            </div>

          </header>

          {loading && <LoadingState />}

          {!loading && erro && (
            <ErrorState
              error={erro}
              onRetry={() => ultimoNumero && handleConsultar(ultimoNumero)}
            />
          )}

          {!loading && resultado?.success && (
            <Suspense fallback={<LoadingState />}>
              <div className="space-y-4">
                <ProcessSummary resultado={resultado} />
                <MovementsTimeline resultado={resultado} />
              </div>
            </Suspense>
          )}
        </section>
      )}
    </main>
  );
}
