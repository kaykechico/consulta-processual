import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchForm from "./SearchForm";

describe("SearchForm", () => {
  const cnjValido = "10092161720238260016";
  const cnjMascara = "1009216-17.2023.8.26.0016";

  it("renderiza campo de busca e botão de pesquisar", () => {
    render(<SearchForm onBuscar={vi.fn()} carregando={false} />);
    expect(screen.getByLabelText(/Número do processo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pesquisar processo/i })).toBeDisabled();
  });

  it("aplica máscara e identifica tribunal para CNJ válido", async () => {
    const user = userEvent.setup();
    render(<SearchForm onBuscar={vi.fn()} carregando={false} />);

    const input = screen.getByLabelText(/Número do processo/i);
    await user.type(input, cnjValido);

    expect(input).toHaveValue(cnjMascara);
    expect(screen.getByText(/Tribunal identificado:/i)).toBeInTheDocument();
    expect(screen.getByText(/TJSP/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pesquisar processo/i })).toBeEnabled();
  });

  it("exibe erro para dígito verificador inválido", async () => {
    const user = userEvent.setup();
    render(<SearchForm onBuscar={vi.fn()} carregando={false} />);

    const input = screen.getByLabelText(/Número do processo/i);
    await user.type(input, "10092169920238260016");

    expect(screen.getByText(/Dígito verificador inválido/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pesquisar processo/i })).toBeDisabled();
  });

  it("dispara onBuscar ao submeter formulário válido", async () => {
    const onBuscar = vi.fn();
    const user = userEvent.setup();
    render(<SearchForm onBuscar={onBuscar} carregando={false} />);

    const input = screen.getByLabelText(/Número do processo/i);
    await user.type(input, cnjValido);

    const botao = screen.getByRole("button", { name: /Pesquisar processo/i });
    await user.click(botao);

    expect(onBuscar).toHaveBeenCalledWith(cnjValido);
  });

  it("extrai e preenche CNJ ao colar texto com máscara ou texto sujo", () => {
    render(<SearchForm onBuscar={vi.fn()} carregando={false} />);
    const input = screen.getByLabelText(/Número do processo/i);

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => `Consulta do processo nº ${cnjMascara} em andamento`,
      },
    });

    expect(input).toHaveValue(cnjMascara);
  });

  it("desabilita campos e exibe spinner durante carregamento", () => {
    render(<SearchForm onBuscar={vi.fn()} carregando={true} valorInicial={cnjValido} />);

    const input = screen.getByLabelText(/Número do processo/i);
    const botao = screen.getByRole("button", { name: /Pesquisar processo/i });

    expect(input).toBeDisabled();
    expect(botao).toBeDisabled();
  });

  it("exibe aviso e desabilita botão para tribunal não disponível na API Pública", async () => {
    const user = userEvent.setup();
    render(<SearchForm onBuscar={vi.fn()} carregando={false} />);

    const input = screen.getByLabelText(/Número do processo/i);
    await user.type(input, "10000008820231000000");

    expect(
      screen.getByText(
        /Tribunal identificado \(Supremo Tribunal Federal\), mas não disponível na API Pública do DataJud\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pesquisar processo/i })).toBeDisabled();
  });
});
