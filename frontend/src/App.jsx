import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Database, RotateCcw, ShieldCheck } from "lucide-react";
import { consultarProcesso, verificarConexaoApi } from "./api/processos.api";
import SearchForm from "./components/SearchForm";
import ProcessSummary from "./components/ProcessSummary";
import MovementsTimeline from "./components/MovementsTimeline";
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
    <main className="app-shell relative min-h-[100dvh] overflow-x-hidden text-zinc-100">
      {!modoResultado && (
        <section className="page-padding relative flex min-h-[100dvh] items-center justify-center py-6 sm:py-10">
          <div className="w-full max-w-[620px]">
            <div className="mb-6 text-center sm:mb-8">
              <div className="surface-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl sm:mb-5 sm:h-14 sm:w-14">
                <Database size={20} className="text-zinc-300" />
              </div>

              <h1 className="text-[clamp(1.75rem,6vw,2.75rem)] font-semibold tracking-[-0.055em] text-white">
                Consulta Jurídica
              </h1>

              <p className="mt-2 text-sm font-medium tracking-[-0.01em] text-zinc-500 sm:mt-3">
                Pesquisa processual por número CNJ
              </p>
            </div>

            {!apiOnline && (
              <div
                role="status"
                className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3.5 py-2.5 text-center text-xs font-medium leading-5 text-amber-100/90"
              >
                Servidor de consulta indisponível no momento. Verifique se o backend está em
                execução.
              </div>
            )}

            <SearchForm onSubmit={handleConsultar} loading={loading} compact />

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
        <section className="page-padding relative mx-auto min-h-[100dvh] w-full max-w-[980px] py-4 sm:py-7 lg:py-9">
          <div className="sticky top-0 z-10 -mx-1 mb-4 rounded-2xl border border-white/5 bg-[#050505]/90 px-1 py-3 backdrop-blur-md sm:static sm:mb-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-xs leading-5 text-zinc-500">
                <span className="block sm:inline">Processo consultado </span>
                <span className="block break-all font-semibold text-zinc-300 sm:inline">
                  {resultado?.numeroFormatado || ultimoNumero}
                </span>
              </div>

              <button
                type="button"
                onClick={novaConsulta}
                className="control inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full px-3.5 py-2.5 text-zinc-300 sm:w-auto"
              >
                <ArrowLeft size={14} />
                Nova consulta
              </button>
            </div>

          </div>

          {loading && <LoadingState />}

          {!loading && erro && (
            <ErrorState
              error={erro}
              onRetry={() => ultimoNumero && handleConsultar(ultimoNumero)}
            />
          )}

          {!loading && resultado?.success && (
            <div className="space-y-3 sm:space-y-4">
              <div className="surface-muted rounded-2xl p-3.5 sm:p-4">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <ShieldCheck size={14} className="shrink-0" />
                    Fonte oficial: DataJud/CNJ
                  </div>

                  {resultado.buscaAmpla && (
                    <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] font-medium text-zinc-400">
                      <RotateCcw size={12} className="shrink-0" />
                      Pesquisa ampliada realizada
                    </div>
                  )}
                </div>
              </div>

              <ProcessSummary resultado={resultado} />
              <MovementsTimeline resultado={resultado} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
