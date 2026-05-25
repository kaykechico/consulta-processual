import { useEffect, useRef, useState } from "react";
import { Check, Clipboard, Loader2, Search } from "lucide-react";
import { formatarNumeroCNJ, limparNumeroCNJ, validarNumeroCNJ } from "../utils/cnj";

export default function SearchForm({ onSubmit, loading }) {
  const [numero, setNumero] = useState("");
  const [copiado, setCopiado] = useState(false);
  const timeoutRef = useRef(null);
  const numeroLimpo = limparNumeroCNJ(numero);
  const valido = validarNumeroCNJ(numero);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    if (valido && !loading) {
      onSubmit(numero);
    }
  }

  async function copiarNumero() {
    try {
      await navigator.clipboard.writeText(numero);
      clearTimeout(timeoutRef.current);
      setCopiado(true);
      timeoutRef.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  const handleInputChange = (event) => {
    const input = event.target;
    const rawVal = input.value;
    const selectionStart = input.selectionStart;
    const lengthBefore = rawVal.length;

    const formatted = formatarNumeroCNJ(rawVal);
    setNumero(formatted);

    requestAnimationFrame(() => {
      const lengthAfter = formatted.length;
      const diff = lengthAfter - lengthBefore;
      let newSelectionStart = selectionStart + diff;
      newSelectionStart = Math.max(0, Math.min(newSelectionStart, lengthAfter));
      input.setSelectionRange(newSelectionStart, newSelectionStart);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[560px]">
      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="numero-processo">
        Número do processo
      </label>

      <div className="surface flex min-h-[58px] overflow-hidden rounded-xl sm:min-h-[62px]">
        <input
          id="numero-processo"
          value={numero}
          onChange={handleInputChange}
          onPaste={(event) => {
            event.preventDefault();
            setNumero(formatarNumeroCNJ(event.clipboardData.getData("text")));
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000000-00.0000.0.00.0000"
          className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium tracking-[0.02em] text-slate-100 outline-none placeholder:text-slate-600"
        />

        {numero && (
          <button
            type="button"
            onClick={copiarNumero}
            className="soft-transition flex w-11 shrink-0 items-center justify-center text-slate-500 hover:text-slate-200"
            aria-label="Copiar número do processo"
          >
            {copiado ? <Check size={16} className="text-accent" /> : <Clipboard size={16} />}
          </button>
        )}

        <button
          type="submit"
          disabled={!valido || loading}
          className="primary-action soft-transition m-1.5 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-35"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span className="hidden xs:inline">Consultar</span>
        </button>
      </div>

      {numeroLimpo.length > 0 && (
        <p className={`mt-2.5 text-xs ${valido ? "text-accent" : "text-slate-500"}`}>
          {valido ? "Número válido." : `${numeroLimpo.length}/20 dígitos. Confira a numeração informada.`}
        </p>
      )}
    </form>
  );
}
