import { useState } from "react";
import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { formatarMascara } from "../utils/mascara";
import styles from "./SearchForm.module.css";

interface SearchFormProps {
  onBuscar: (numero: string) => void;
  carregando: boolean;
}

export default function SearchForm({ onBuscar, carregando }: SearchFormProps) {
  const [valor, setValor] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valor.length === 20) {
      onBuscar(valor);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label} htmlFor="numero-processo">
        Número do processo
      </label>
      <div className={styles.campo}>
        <input
          id="numero-processo"
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Digite o número CNJ, ex.: 0001234-56.2025.8.26.0100"
          value={formatarMascara(valor)}
          onChange={(event) =>
            setValor(event.target.value.replace(/\D/g, "").slice(0, 20))
          }
          disabled={carregando}
        />
        <button
          className={styles.botao}
          type="submit"
          disabled={carregando || valor.length < 20}
          aria-label="Pesquisar processo"
        >
          {carregando ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <>
              <Search size={17} strokeWidth={2} aria-hidden="true" />
              Pesquisar
            </>
          )}
        </button>
      </div>
    </form>
  );
}