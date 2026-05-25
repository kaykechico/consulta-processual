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
    <article className="rounded-lg border border-slate-800/80 bg-slate-900/25 p-4 soft-transition hover:border-slate-700 sm:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {formatarData(movimento?.dataHora || movimento?.data)}
          </p>

          <h3 className="mt-1.5 break-words text-sm font-medium leading-6 text-slate-200">
            {nome}
          </h3>
        </div>

        {referencia && (
          <span className="w-fit shrink-0 rounded-md bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-400">
            Referência {formatarTexto(referencia)}
          </span>
        )}
      </div>

      {orgao && (
        <p className="mt-3 break-words text-xs leading-5 text-slate-400">
          <strong className="text-slate-300">Órgão responsável:</strong>{" "}
          {extrairNome(orgao)}
        </p>
      )}

      {Array.isArray(complementos) && complementos.length > 0 && (
        <div className="mt-3 rounded-lg bg-slate-800/30 p-3">
          <p className="mb-2 text-xs font-medium text-slate-400">Complementações</p>

          <ul className="space-y-1 text-xs leading-5 text-slate-400">
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
    <section className="surface rounded-xl">
      <div className="flex w-full flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-7">
        <div>
          <div className="inline-flex items-center gap-2 font-display text-xl font-medium tracking-[-0.025em] text-slate-100">
            <GitBranch size={16} className="text-accent" />
            Andamentos
            <span className="rounded-full bg-slate-800/70 px-2 py-0.5 font-sans text-[11px] text-slate-400">
              {movimentos.length}
            </span>
          </div>

        </div>
      </div>

      <div className="space-y-3 border-t border-slate-800 p-4 pt-4 sm:p-7 sm:pt-6">
        {movimentos.length === 0 ? (
          <div className="rounded-lg bg-slate-800/25 p-4 text-sm text-slate-400">
            Nenhum andamento público foi encontrado.
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
              className="control inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-300 sm:w-auto"
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
