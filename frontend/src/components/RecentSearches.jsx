import { Clock3, Search, Trash2, X } from "lucide-react";

function formatarData(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function RecentSearches({ items, onSelect, onRemove, onClear }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="surface-muted mx-auto mt-7 w-full max-w-[540px] rounded-2xl p-3 sm:mt-8">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <Clock3 size={14} />
          Consultas recentes
        </div>

        <button
          type="button"
          onClick={onClear}
          className="soft-transition inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
        >
          <X size={12} />
          Limpar
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.numeroLimpo}
            className="group flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 p-2 soft-transition hover:border-white/10 hover:bg-white/[0.04]"
          >
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-400">
                <Search size={13} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-zinc-200">
                  {item.numeroFormatado}
                </span>

                <span className="mt-0.5 block truncate text-[11px] font-medium text-zinc-600">
                  {item.tribunal ? `${item.tribunal} · ` : ""}
                  {formatarData(item.searchedAt)}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onRemove(item.numeroLimpo)}
              className="soft-transition flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 opacity-100 hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
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