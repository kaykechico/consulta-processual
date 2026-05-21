import { useState } from "react";
import {
  Check,
  Clipboard,
  Landmark,
  Layers,
  LockKeyhole,
  Monitor,
  Scale,
  Shield,
  UserRoundCheck
} from "lucide-react";
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

function Field({ icon: Icon, label, value, wide }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-zinc-500">
        {Icon && <Icon size={12} />}
        {label}
      </dt>

      <dd className="break-words text-[15px] font-semibold tracking-[-0.025em] text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-7 border-t border-white/10 pt-5">
      <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">
        {title}
      </h3>

      {children}
    </div>
  );
}

export default function ProcessSummary({ resultado }) {
  const source = getSource(resultado);
  const assuntos = extrairAssuntos(source);
  const [copiado, setCopiado] = useState(false);

  async function copiarNumero() {
    try {
      await navigator.clipboard.writeText(resultado.numeroFormatado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
    }
  }

  return (
    <section className="surface rounded-2xl p-4 sm:p-6">
      <div className="mb-5 sm:mb-7">
        <dt className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-zinc-500">
          Número processual
        </dt>

        <dd className="flex flex-wrap items-start gap-2 text-[clamp(1.125rem,4.5vw,1.75rem)] font-bold leading-tight tracking-[-0.055em] text-white">
          <span className="break-all">{resultado.numeroFormatado}</span>

          <button
            onClick={copiarNumero}
            className="soft-transition rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-100"
            aria-label="Copiar número processual"
          >
            {copiado ? <Check size={15} className="text-green-500" /> : <Clipboard size={15} />}
          </button>
        </dd>
      </div>

      <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <Field
          icon={Landmark}
          label="Tribunal"
          value={traduzirValor(resultado.tribunalDetectado || "Não identificado")}
        />

        <Field icon={Layers} label="Grau de jurisdição" value={getGrau(source)} />

        <Field icon={Scale} label="Classe processual" value={getClasse(source)} wide />

        <Field icon={UserRoundCheck} label="Órgão julgador" value={getOrgaoJulgador(source)} />

        <Field icon={Shield} label="Nível de sigilo" value={getNivelSigilo(source)} />

        <Field icon={Monitor} label="Sistema de tramitação" value={getSistema(source)} />

        <Field icon={LockKeyhole} label="Meio de tramitação" value={getFormato(source)} />

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
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium leading-6 text-zinc-300"
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