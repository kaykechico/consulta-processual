import {
  extrairAssuntos,
  formatarData,
  getClasse,
  getFormato,
  getGrau,
  getNivelSigilo,
  getOrgaoJulgador,
  getSistema,
  getSource,
  traduzirValor
} from "../utils/processo";

function Field({ label, value, wide }) {
  return (
    <div className={`border-b border-slate-800/80 pb-4 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="mb-1.5 text-xs text-slate-500">{label}</dt>

      <dd className="break-words text-sm font-medium leading-6 text-slate-200 sm:text-[15px]">
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-7 border-t border-slate-800 pt-5">
      <h3 className="mb-4 text-base font-medium text-slate-200">{title}</h3>

      {children}
    </div>
  );
}

export default function ProcessSummary({ resultado }) {
  const source = getSource(resultado);
  const assuntos = extrairAssuntos(source);

  return (
    <section className="surface rounded-xl p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-medium tracking-[-0.03em] text-slate-100">
          Dados do processo
        </h2>
      </div>

      <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
        <Field
          label="Tribunal"
          value={traduzirValor(resultado.tribunalDetectado || "Não identificado")}
        />

        <Field label="Grau de jurisdição" value={getGrau(source)} />

        <Field label="Classe processual" value={getClasse(source)} wide />

        <Field label="Órgão julgador" value={getOrgaoJulgador(source)} />

        <Field label="Nível de sigilo" value={getNivelSigilo(source)} />

        <Field label="Sistema de tramitação" value={getSistema(source)} />

        <Field label="Meio de tramitação" value={getFormato(source)} />

        <Field label="Data de ajuizamento" value={formatarData(source?.dataAjuizamento)} />

        <Field
          label="Última atualização na base consultada"
          value={formatarData(source?.dataHoraUltimaAtualizacao || source?.["@timestamp"])}
        />
      </dl>

      {assuntos.length > 0 && (
        <Section title="Assuntos processuais">
          <ul className="space-y-2">
            {assuntos.map((assunto, index) => (
              <li
                key={`${assunto}-${index}`}
                className="rounded-lg bg-slate-800/35 px-3.5 py-2.5 text-sm leading-6 text-slate-300"
              >
                {assunto}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </section>
  );
}
