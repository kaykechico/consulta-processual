import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <section className="surface rounded-2xl p-6 sm:p-10">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="surface-muted flex h-14 w-14 items-center justify-center rounded-2xl">
          <Loader2 size={26} className="animate-spin text-zinc-300" />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-[-0.035em] text-zinc-100">
            Processando consulta processual
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Aguarde a recuperação das informações públicas disponíveis.
          </p>
        </div>
      </div>
    </section>
  );
}