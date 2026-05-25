import { AlertTriangle, RotateCcw, SearchX } from "lucide-react";

export default function ErrorState({ error, onRetry }) {
  const naoEncontrado = error?.error === "REGISTRO_PROCESSUAL_NAO_LOCALIZADO";
  const Icon = naoEncontrado ? SearchX : AlertTriangle;

  const titulo = naoEncontrado
    ? "Registro processual não localizado"
    : "Consulta processual não concluída";
  const estiloContainer = naoEncontrado
    ? "border-slate-800 bg-slate-900/35"
    : "border-red-400/15 bg-red-500/[0.035]";

  const estiloIcone = naoEncontrado
    ? "border-slate-800 bg-slate-800/60 text-slate-400"
    : "border-red-300/20 bg-red-300/10 text-red-200";

  const estiloTitulo = naoEncontrado ? "text-slate-100" : "text-red-100";
  const estiloTexto = naoEncontrado ? "text-slate-300" : "text-red-100/75";
  const estiloBotao = naoEncontrado
    ? "border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800"
    : "border-red-200/20 bg-red-200/10 text-red-100 hover:bg-red-200/15";

  return (
    <section
      className={`rounded-2xl border p-5 shadow-[0_24px_72px_rgba(0,0,0,0.3)] sm:p-7 ${estiloContainer}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${estiloIcone}`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className={`text-lg font-medium ${estiloTitulo}`}>{titulo}</h2>

          <p className={`mt-1 text-sm font-medium leading-6 ${estiloTexto}`}>{error?.message}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold soft-transition sm:w-auto ${estiloBotao}`}
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
