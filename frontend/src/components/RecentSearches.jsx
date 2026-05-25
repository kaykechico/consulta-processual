import { Clock3, Search, Trash2, X } from "lucide-react";

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

function formatarData(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatadorData.format(date);
}

export default function RecentSearches({ items, onSelect, onRemove, onClear }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-[560px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-400">
          <Clock3 size={13} />
          Consultas recentes
        </div>

        <button
          type="button"
          onClick={onClear}
          className="soft-transition inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
        >
          <X size={12} />
          Limpar
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.numeroLimpo}
            className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/35 p-2.5 soft-transition hover:border-slate-700 hover:bg-slate-800/35"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-400">
                <Search size={13} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-[#e8e2d5]">
                  {item.numeroFormatado}
                </span>

                <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                  {item.tribunal ? `${item.tribunal} · ` : ""}
                  {formatarData(item.searchedAt)}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRemove(item.numeroLimpo)}
              className="soft-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 opacity-100 hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Excluir consulta recente"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
