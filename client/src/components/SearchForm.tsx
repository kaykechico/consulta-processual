import { useEffect, useState } from "react";
import type { FormEvent, ClipboardEvent } from "react";
import { Search } from "lucide-react";
import { formatarMascara } from "../utils/mascara";
import { validateCNJ, getTribunalFromCNJ, extrairCNJ } from "@consulta/shared";
import styles from "./SearchForm.module.css";

interface SearchFormProps {
  onBuscar: (numero: string) => void;
  carregando: boolean;
  valorInicial?: string;
  compact?: boolean;
}

export default function SearchForm({
  onBuscar,
  carregando,
  valorInicial = "",
  compact = false,
}: SearchFormProps) {
  const [valor, setValor] = useState(valorInicial);

  useEffect(() => {
    setValor(valorInicial.replace(/\D/g, "").slice(0, 20));
  }, [valorInicial]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valor.length === 20 && validateCNJ(valor)) {
      onBuscar(valor);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const texto = event.clipboardData.getData("text");
    const extraido = extrairCNJ(texto);
    if (extraido) {
      event.preventDefault();
      setValor(extraido);
    }
  };

  const cnjValido = valor.length === 20 && validateCNJ(valor);
  const tribunal = cnjValido ? getTribunalFromCNJ(valor) : null;
  const tribunalNaoSuportado = cnjValido && tribunal?.suportadoDatajud === false;
  const tribunalDesconhecido = cnjValido && !tribunal;
  const invalido = valor.length === 20 && !validateCNJ(valor);

  return (
    <form
      className={`${styles.form} ${compact ? styles.compact : ""}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <label className={styles.label} htmlFor="numero-processo">
        Número do processo
      </label>
      <div className={`${styles.campo} ${compact ? styles.compactCampo : ""}`}>
        <div className={styles.inputWrapper}>
          <Search size={16} className={styles.inputIcon} aria-hidden="true" />
          <input
            id="numero-processo"
            className={styles.input}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={
              compact
                ? "Buscar outro processo CNJ..."
                : "Digite o número CNJ (ex.: 0001234-56.2025.8.26.0100)"
            }
            value={formatarMascara(valor)}
            onChange={(event) => setValor(event.target.value.replace(/\D/g, "").slice(0, 20))}
            onPaste={handlePaste}
            disabled={carregando}
            aria-invalid={
              invalido || tribunalDesconhecido || tribunalNaoSuportado ? "true" : undefined
            }
            aria-describedby={
              tribunal && !tribunalNaoSuportado
                ? "tribunal-identificado"
                : tribunalNaoSuportado
                  ? "tribunal-nao-suportado"
                  : tribunalDesconhecido
                    ? "tribunal-aviso"
                    : invalido
                      ? "cnj-invalido"
                      : undefined
            }
          />
        </div>
        <button
          className={styles.botao}
          type="submit"
          disabled={
            carregando ||
            valor.length < 20 ||
            invalido ||
            tribunalDesconhecido ||
            tribunalNaoSuportado
          }
          aria-label="Pesquisar processo"
        >
          {carregando ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : compact ? (
            <Search size={16} aria-hidden="true" />
          ) : (
            "Pesquisar"
          )}
        </button>
      </div>
      {tribunal && !tribunalNaoSuportado && (
        <p id="tribunal-identificado" className={styles.tribunal} role="status" aria-live="polite">
          Tribunal identificado: <strong>{tribunal.nome}</strong> ({tribunal.alias.toUpperCase()})
        </p>
      )}
      {tribunalNaoSuportado && (
        <p id="tribunal-nao-suportado" className={styles.erro} role="alert">
          Tribunal identificado ({tribunal?.nome}), mas não disponível na API Pública do DataJud.
        </p>
      )}
      {tribunalDesconhecido && (
        <p id="tribunal-aviso" className={styles.erro} role="alert">
          Tribunal não suportado para este código CNJ.
        </p>
      )}
      {invalido && (
        <p id="cnj-invalido" className={styles.erro} role="alert">
          Dígito verificador inválido. Confira o número CNJ.
        </p>
      )}
    </form>
  );
}
