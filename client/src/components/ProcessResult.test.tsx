import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProcessResult from "./ProcessResult";
import type { Processo } from "@consulta/shared";

const mockProcessoCompleto: Processo = {
  numeroProcesso: "1009216-17.2023.8.26.0016",
  tribunal: "TJSP",
  grau: "G1",
  instancia: "1ª Instância",
  competencia: "Cível",
  nivelSigilo: 0,
  classe: { codigo: 7, nome: "Procedimento Comum Cível" },
  assuntos: [{ codigo: 10433, nome: "Indenização por Dano Moral" }],
  orgaoJulgador: { codigo: 16, nome: "1ª Vara Cível" },
  sistema: { nome: "ESAJ" },
  formato: { nome: "Eletrônico" },
  datasRelevantes: [{ rotulo: "Distribuição", valor: "2023-05-10T10:00:00.000Z" }],
  ultimaMovimentacao: {
    nome: "Julgado procedente o pedido",
    dataHora: "2023-06-01T15:30:00.000Z",
    categoria: "SENTENCA",
  },
  partes: [
    {
      nome: "Fulano de Tal",
      tipoParte: "Autor",
      tipoPessoa: "Física",
      isMinisterioPublico: false,
      advogados: [{ nome: "Dra. Advogada", numeroOAB: "123456/SP" }],
      representantes: [{ nome: "Representante Legal" }],
    },
    {
      nome: "Ministério Público do Estado de São Paulo",
      tipoParte: "Fiscal da Ordem Jurídica",
      isMinisterioPublico: true,
      advogados: [],
      representantes: [],
    },
  ],
  movimentos: [
    {
      codigo: 60,
      nome: "Expedição de intimação",
      dataHora: "2023-05-15T12:00:00.000Z",
      complementos: ["Para manifestação em 15 dias"],
    },
    {
      codigo: 193,
      nome: "Julgado procedente o pedido",
      dataHora: "2023-06-01T15:30:00.000Z",
      complementos: [],
    },
  ],
};

describe("ProcessResult", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  it("renderiza dados principais do processo e cabeçalho", () => {
    render(<ProcessResult processo={mockProcessoCompleto} />);

    expect(screen.getByText("1009216-17.2023.8.26.0016")).toBeInTheDocument();
    expect(screen.getByText("TJSP")).toBeInTheDocument();
    expect(screen.getByText("1ª Instância")).toBeInTheDocument();
    expect(screen.getByText("· Cível")).toBeInTheDocument();
    expect(screen.getByText("Procedimento Comum Cível")).toBeInTheDocument();
    expect(screen.getByText("Indenização por Dano Moral")).toBeInTheDocument();
  });

  it("renderiza condicionalmente seções de Partes e Ministério Público", () => {
    render(<ProcessResult processo={mockProcessoCompleto} />);

    expect(screen.getByRole("region", { name: "Partes" })).toBeInTheDocument();
    expect(screen.getByText("Fulano de Tal")).toBeInTheDocument();
    expect(screen.getByText(/Advogados: Dra. Advogada \(OAB 123456\/SP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Representantes: Representante Legal/i)).toBeInTheDocument();

    expect(screen.getByRole("region", { name: "Ministério Público" })).toBeInTheDocument();
    expect(screen.getByText("Ministério Público do Estado de São Paulo")).toBeInTheDocument();
  });

  it("não renderiza seções de Partes e MP quando ausentes", () => {
    const processoSemPartes: Processo = {
      ...mockProcessoCompleto,
      partes: [],
    };
    render(<ProcessResult processo={processoSemPartes} />);

    expect(screen.queryByRole("region", { name: "Partes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Ministério Público" })).not.toBeInTheDocument();
  });

  it("renderiza movimentos e permite filtrar e buscar", async () => {
    const user = userEvent.setup();
    render(<ProcessResult processo={mockProcessoCompleto} />);

    expect(screen.getByRole("region", { name: /Movimentações \(2\)/i })).toBeInTheDocument();
    expect(screen.getAllByText("Expedição de intimação").length).toBeGreaterThan(0);
    expect(screen.getByText("Para manifestação em 15 dias")).toBeInTheDocument();

    const inputBusca = screen.getByLabelText(/Buscar na timeline/i);
    await user.type(inputBusca, "procedente");

    expect(screen.getByRole("region", { name: /Movimentações \(1\)/i })).toBeInTheDocument();
    expect(screen.getAllByText("Julgado procedente o pedido").length).toBeGreaterThan(0);
  });

  it("inclui todas as categorias no filtro", () => {
    render(<ProcessResult processo={mockProcessoCompleto} />);

    expect(screen.getByRole("option", { name: "Documentos" })).toBeInTheDocument();
  });

  it("exibe aviso quando nenhum movimento corresponde ao filtro", async () => {
    const user = userEvent.setup();
    render(<ProcessResult processo={mockProcessoCompleto} />);

    const inputBusca = screen.getByLabelText(/Buscar na timeline/i);
    await user.type(inputBusca, "termo inexistente");

    expect(
      screen.getByText("Nenhuma movimentação encontrada para o filtro aplicado.")
    ).toBeInTheDocument();
  });

  it("exibe nível de sigilo quando informado no processo", () => {
    const processoSigiloso: Processo = {
      ...mockProcessoCompleto,
      nivelSigilo: 1,
    };
    render(<ProcessResult processo={processoSigiloso} />);

    expect(screen.getByText("Nível de sigilo")).toBeInTheDocument();
    expect(screen.getByText("Segredo de Justiça")).toBeInTheDocument();
  });

  it("permite interagir com botão de copiar resumo", () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextSpy,
      },
      writable: true,
      configurable: true,
    });

    render(<ProcessResult processo={mockProcessoCompleto} />);

    const botaoMenu = screen.getByRole("button", { name: /Mais ações/i });
    fireEvent.click(botaoMenu);

    const botaoCopiarResumo = screen.getByRole("menuitem", { name: /Copiar resumo/i });
    fireEvent.click(botaoCopiarResumo);

    expect(writeTextSpy).toHaveBeenCalled();
  });

  it("não copia a URL quando o compartilhamento nativo é cancelado", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    const shareSpy = vi.fn().mockRejectedValue(new DOMException("Cancelado", "AbortError"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: shareSpy,
      writable: true,
      configurable: true,
    });

    render(<ProcessResult processo={mockProcessoCompleto} />);
    await user.click(screen.getByRole("button", { name: "Compartilhar" }));
    await vi.waitFor(() => expect(shareSpy).toHaveBeenCalled());

    expect(writeTextSpy).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, "share");
  });

  it("exibe aviso específico quando processo não tem nenhuma movimentação no DataJud", () => {
    const processoSemMovimentos: Processo = {
      ...mockProcessoCompleto,
      movimentos: [],
    };
    render(<ProcessResult processo={processoSemMovimentos} />);

    expect(
      screen.getByText("Este processo não possui movimentações públicas cadastradas no DataJud.")
    ).toBeInTheDocument();
  });

  it("permite copiar o número do processo pelo botão de cabeçalho", () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });

    render(<ProcessResult processo={mockProcessoCompleto} />);
    const botaoCopiar = screen.getByRole("button", { name: /Copiar número do processo/i });
    fireEvent.click(botaoCopiar);

    expect(writeTextSpy).toHaveBeenCalledWith("1009216-17.2023.8.26.0016");
  });

  it("exibe link para fonte oficial do tribunal quando disponível", () => {
    render(<ProcessResult processo={mockProcessoCompleto} />);
    const linkFonte = screen.getByRole("link", { name: /Consultar processo na fonte oficial/i });
    expect(linkFonte).toBeInTheDocument();
    expect(linkFonte).toHaveAttribute("href", "https://esaj.tjsp.jus.br/cpopg/open.do");
  });

  it("exibe órgão julgador na movimentação quando disponível", () => {
    const processoComOrgao: Processo = {
      ...mockProcessoCompleto,
      movimentos: [
        {
          codigo: 193,
          nome: "Sentença proferida",
          dataHora: "2023-06-01T12:30:00.000Z",
          complementos: [],
          orgaoJulgador: { nome: "2ª Vara Cível da Comarca" },
        },
      ],
    };
    render(<ProcessResult processo={processoComOrgao} />);
    expect(screen.getByText("2ª Vara Cível da Comarca")).toBeInTheDocument();
  });

  it("filtra movimentações por intervalo de datas", async () => {
    const user = userEvent.setup();
    render(<ProcessResult processo={mockProcessoCompleto} />);

    const inputInicio = screen.getByLabelText(/Data inicial/i);
    await user.type(inputInicio, "2023-05-20");

    expect(screen.getAllByText("Julgado procedente o pedido").length).toBeGreaterThan(0);
    expect(screen.queryByText("Expedição de intimação")).not.toBeInTheDocument();
  });

  it("exibe mensagem de erro visual quando data inicial é posterior à data final", async () => {
    const user = userEvent.setup();
    render(<ProcessResult processo={mockProcessoCompleto} />);

    const inputInicio = screen.getByLabelText(/Data inicial/i);
    const inputFim = screen.getByLabelText(/Data final/i);

    await user.type(inputInicio, "2023-06-01");
    await user.type(inputFim, "2023-05-01");

    expect(
      screen.getByText("A data inicial não pode ser posterior à data final.")
    ).toBeInTheDocument();
  });

  it("limita a timeline e permite carregar mais movimentações", async () => {
    const user = userEvent.setup();
    const processoGrande: Processo = {
      ...mockProcessoCompleto,
      movimentos: Array.from({ length: 55 }, (_, i) => ({
        codigo: i + 1,
        nome: `Movimento ${i + 1}`,
        dataHora: `2023-06-${String((i % 9) + 1).padStart(2, "0")}T12:00:00.000Z`,
        complementos: [],
      })),
    };

    render(<ProcessResult processo={processoGrande} />);

    expect(
      screen.getByRole("button", { name: /Carregar mais movimentações/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Exibindo 50 de 55 movimentações.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Carregar mais movimentações/i }));

    expect(
      screen.queryByRole("button", { name: /Carregar mais movimentações/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Movimento 55")).toBeInTheDocument();
  });
});
