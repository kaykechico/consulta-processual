import { Loader2 } from "lucide-react";

export default function LoadingState() {
  return (
    <section className="surface rounded-xl p-7 sm:p-10">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 size={23} className="animate-spin text-accent" />

        <div>
          <h2 className="text-base font-medium text-slate-200">
            Buscando processo...
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Isso pode levar alguns segundos.
          </p>
        </div>
      </div>
    </section>
  );
}
