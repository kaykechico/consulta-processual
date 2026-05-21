import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GitBranch } from "lucide-react";
import {
  extrairMovimentos,
  extrairNome,
  formatarData,
  formatarTexto,
  getSource
} from "../utils/processo";

function MovimentoCard({ movimento }) {
  const nome = extrairNome(movimento?.movimento || movimento?.nome || movimento?.tipoMovimento);
  const referencia =
    movimento?.codigo || movimento?.movimento?.codigo || movimento?.tipoMovimento?.codigo;
  const complementos = movimento?.complementosTabelados || movimento?.complementos || [];
  const orgao = movimento?.orgaoJulgador || movimento?.orgao;

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.025] p-4 soft-transition hover:border-white/[0.14] hover:bg-white/[0.035]">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-500">
            {formatarData(movimento?.dataHora || movimento?.data)}
          </p>

          <h3 className="mt-1.5 break-words text-sm font-semibold leading-6 tracking-[-0.015em] text-zinc-100">
            {nome}
          </h3>
        </div>

        {referencia && (
          <span className="w-fit shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Referência {formatarTexto(referencia)}
          </span>
        )}
      </div>

      {orgao && (
        <p className="mt-3 break-words text-xs leading-5 text-zinc-400">
          <strong className="text-zinc-300">Órgão responsável:</strong>{" "}
          {extrairNome(orgao)}
        </p>
      )}

      {Array.isArray(complementos) && complementos.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
            Complementações do andamento
          </p>

          <ul className="space-y-1 text-xs leading-5 text-zinc-400">
            {complementos.map((complemento, index) => (
              <li key={index} className="break-words">
                {formatarTexto(
                  complemento?.nome ||
                    complemento?.descricao ||
                    complemento?.valor ||
                    complemento
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function MovementsTimeline({ resultado }) {
  const movimentos = useMemo(() => extrairMovimentos(getSource(resultado)), [resultado]);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const limiteInicial = 8;
  const temMais = movimentos.length > limiteInicial;
  const movimentosVisiveis = mostrarTodos ? movimentos : movimentos.slice(0, limiteInicial);
  const quantidadeOculta = Math.max(movimentos.length - limiteInicial, 0);

  return (
    <section className="surface rounded-2xl">
      <div className="flex w-full flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-zinc-200">
            <GitBranch size={15} />
            Andamentos processuais
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-400">
              {movimentos.length}
            </span>
          </div>

          {movimentos.length > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              Registros ordenados do mais recente para o mais antigo.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 p-4 pt-4 sm:p-6 sm:pt-5">
        {movimentos.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
            Não foram localizados andamentos processuais públicos para esta numeração.
          </div>
        ) : (
          movimentosVisiveis.map((movimento, index) => (
            <MovimentoCard
              key={`${movimento?.dataHora || movimento?.data || "mov"}-${index}`}
              movimento={movimento}
            />
          ))
        )}

        {temMais && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setMostrarTodos((value) => !value)}
              className="control inline-flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-300 sm:w-auto"
            >
              {mostrarTodos ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {mostrarTodos
                ? "Recolher andamentos anteriores"
                : `Exibir ${quantidadeOculta} andamentos anteriores`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}