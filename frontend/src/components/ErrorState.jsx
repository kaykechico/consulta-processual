import { AlertTriangle, RotateCcw, SearchX } from "lucide-react";

export default function ErrorState({ error, onRetry }) {
  const naoEncontrado = error?.error === "REGISTRO_PROCESSUAL_NAO_LOCALIZADO";
  const Icon = naoEncontrado ? SearchX : AlertTriangle;

  const titulo = naoEncontrado
    ? "Registro processual não localizado"
    : "Consulta processual não concluída";

  const estiloContainer = naoEncontrado
    ? "border-amber-400/15 bg-amber-500/[0.055]"
    : "border-red-400/15 bg-red-500/[0.055]";

  const estiloIcone = naoEncontrado
    ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
    : "border-red-300/20 bg-red-300/10 text-red-200";

  const estiloTitulo = naoEncontrado ? "text-amber-100" : "text-red-100";
  const estiloTexto = naoEncontrado ? "text-amber-100/75" : "text-red-100/75";
  const estiloBotao = naoEncontrado
    ? "border-amber-200/20 bg-amber-200/10 text-amber-100 hover:bg-amber-200/15"
    : "border-red-200/20 bg-red-200/10 text-red-100 hover:bg-red-200/15";

  return (
    <section
      className={`rounded-2xl border p-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-6 ${estiloContainer}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${estiloIcone}`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className={`text-lg font-bold tracking-[-0.035em] ${estiloTitulo}`}>{titulo}</h2>

          <p className={`mt-1 text-sm font-medium leading-6 ${estiloTexto}`}>{error?.message}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold soft-transition sm:w-auto ${estiloBotao}`}
            >
              <RotateCcw size={14} />
              Repetir consulta
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
