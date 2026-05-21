import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Loader2, Search } from "lucide-react";
import { formatarNumeroCNJ, limparNumeroCNJ, validarNumeroCNJ } from "../utils/cnj";

export default function SearchForm({ onSubmit, loading, compact = false, initialValue = "" }) {
  const [numero, setNumero] = useState(initialValue);
  const [copiado, setCopiado] = useState(false);
  const numeroLimpo = useMemo(() => limparNumeroCNJ(numero), [numero]);
  const valido = validarNumeroCNJ(numero);

  useEffect(() => {
    if (initialValue) {
      setNumero(formatarNumeroCNJ(initialValue));
    }
  }, [initialValue]);

  function handleSubmit(event) {
    event.preventDefault();

    if (valido && !loading) {
      onSubmit(numero);
    }
  }

  async function copiarNumero() {
    if (!numero) {
      return;
    }

    try {
      await navigator.clipboard.writeText(numero);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      
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

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[540px]">
        <div className="surface flex min-h-[52px] overflow-hidden rounded-[17px] sm:min-h-[56px]">
          <div className="hidden w-11 shrink-0 items-center justify-center text-zinc-500 xs:flex sm:w-12">
            <Search size={16} />
          </div>

          <input
            value={numero}
            onChange={handleInputChange}
            onPaste={(event) => {
              event.preventDefault();
              const text = event.clipboardData.getData("text");
              setNumero(formatarNumeroCNJ(text));
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Informe o número CNJ"
            className="min-w-0 flex-1 bg-transparent px-3.5 text-[14px] font-semibold tracking-[-0.025em] text-zinc-100 outline-none placeholder:text-zinc-600 xs:px-4 sm:text-[15px]"
          />

          {numero && (
            <button
              type="button"
              onClick={copiarNumero}
              className="soft-transition flex w-10 shrink-0 items-center justify-center text-zinc-600 hover:text-zinc-200 sm:w-11"
              aria-label="Copiar número do processo"
            >
              {copiado ? <Check size={15} className="text-green-500" /> : <Clipboard size={15} />}
            </button>
          )}

          <button
            type="submit"
            disabled={!valido || loading}
            className="soft-transition m-1.5 flex w-11 shrink-0 items-center justify-center rounded-[13px] bg-zinc-100 text-black hover:bg-white disabled:opacity-35 sm:w-12"
            aria-label="Consultar processo"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] font-medium text-zinc-600">
          <span>{numeroLimpo.length}/20 dígitos informados</span>

          {!valido && numeroLimpo.length > 0 && (
            <span className="text-zinc-400">
              Numeração processual incompleta ou inválida
            </span>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <input
        value={numero}
        onChange={handleInputChange}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text");
          setNumero(formatarNumeroCNJ(text));
        }}
        inputMode="numeric"
        autoComplete="off"
        placeholder="Informe o número CNJ"
        className="control h-12 rounded-2xl px-4 text-sm font-semibold text-zinc-100 outline-none placeholder:text-zinc-600"
      />

      <button
        type="button"
        onClick={copiarNumero}
        disabled={!numero}
        className="control inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-zinc-300 disabled:opacity-40"
      >
        {copiado ? (
          <>
            <Check size={16} className="text-green-500" />
            Copiado!
          </>
        ) : (
          <>
            <Clipboard size={16} />
            Copiar número
          </>
        )}
      </button>

      <button
        type="submit"
        disabled={!valido || loading}
        className="soft-transition inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-5 text-sm font-bold text-black hover:bg-white disabled:opacity-40"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
        Consultar processo
      </button>
    </form>
  );
}