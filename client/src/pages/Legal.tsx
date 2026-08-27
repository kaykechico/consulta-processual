import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import styles from "./Legal.module.css";
import type { ReactNode } from "react";

interface LegalProps {
  titulo: string;
  atualizado: string;
  secoes: { titulo: string; texto: ReactNode }[];
}

function Legal({ titulo, atualizado, secoes }: LegalProps) {
  return (
    <main className={styles.main}>
      <Link to="/" className={styles.voltar} aria-label="Voltar para a página inicial">
        <ArrowLeft size={16} aria-hidden="true" />
        <span>Voltar</span>
      </Link>
      <article className={styles.artigo}>
        <header className={styles.cabecalho}>
          <h1 className={styles.titulo}>{titulo}</h1>
          <p className={styles.atualizado}>Última atualização: {atualizado}</p>
        </header>
        <div className={styles.secoes}>
          {secoes.map((s) => (
            <section key={s.titulo} className={styles.secao}>
              <h2 className={styles.secaoTitulo}>{s.titulo}</h2>
              <div className={styles.texto}>{s.texto}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

export function Privacidade() {
  return (
    <Legal
      titulo="Política de Privacidade"
      atualizado="24 de agosto de 2026"
      secoes={[
        {
          titulo: "Dados consultados",
          texto:
            "Os números de processo consultados são enviados ao nosso servidor apenas para realização da consulta na API pública do DataJud (CNJ). O servidor não armazena em banco de dados nenhum número, histórico ou dado pessoal; apenas cache em memória temporário (TTL 5 min, negativo 30s) para performance.",
        },
        {
          titulo: "Dados locais (navegador)",
          texto:
            'O histórico de consultas recentes fica armazenado apenas no seu navegador, em localStorage, com TTL de 30 dias e limite de 20 entradas. Você pode desativar o salvamento, apagar itens individuais ou limpar tudo em "Consultas recentes". Nenhum dado do histórico é enviado ao servidor.',
        },
        {
          titulo: "Minimização e logs",
          texto:
            "O backend registra apenas métricas agregadas (consultas, cache hit/miss, latência) e metadados de erro (código, tribunal alias). Não registra CNJ completo em todos os logs nem dados pessoais das partes. Rate limiting é por IP sem identificação pessoal.",
        },
        {
          titulo: "Serviços de terceiros",
          texto:
            "Ao consultar, o número é encaminhado ao DataJud (api-publica.datajud.cnj.jus.br) conforme termos do CNJ. Nenhum outro serviço recebe seus dados.",
        },
        {
          titulo: "Segurança",
          texto:
            "A chave de acesso ao DataJud fica somente no servidor e nunca é exposta ao navegador. Em produção, use HTTPS; headers de segurança (CSP, HSTS, X-Content-Type-Options) são aplicados.",
        },
      ]}
    />
  );
}

export function Termos() {
  return (
    <Legal
      titulo="Termos de Uso"
      atualizado="20 de agosto de 2026"
      secoes={[
        {
          titulo: "Serviço informativo",
          texto:
            "Esta ferramenta é um serviço informativo e demonstrativo. Ela não substitui os sistemas oficiais dos tribunais, o Diário de Justiça Eletrônico ou qualquer canal oficial do Poder Judiciário.",
        },
        {
          titulo: "Fonte dos dados",
          texto:
            "Os dados exibidos provêm da API pública do DataJud (CNJ). A integridade, atualidade e exatidão das informações dependem dos tribunais e do próprio CNJ. Processos com segredo de justiça não têm seus dados divulgados integralmente.",
        },
        {
          titulo: "Uso responsável",
          texto:
            "Consulte apenas o necessário e não realize consultas em massa ou automatizadas. O uso indevido da API pode resultar em bloqueio pela política de uso do CNJ.",
        },
        {
          titulo: "Sem garantias",
          texto:
            "Este serviço é fornecido sem garantias de qualquer tipo. Não o utilize como única base para decisões judiciais, profissionais ou pessoais. Confirme a informação na fonte oficial antes de qualquer providência.",
        },
      ]}
    />
  );
}

export function Aviso() {
  return (
    <Legal
      titulo="Aviso Legal"
      atualizado="24 de agosto de 2026"
      secoes={[
        {
          titulo: "Natureza do serviço",
          texto:
            "Este projeto é independente e não possui vínculo com o Conselho Nacional de Justiça, tribunais ou qualquer órgão público. Não é um serviço jurídico oficial.",
        },
        {
          titulo: "Limitação de responsabilidade",
          texto:
            "Os mantenedores não se responsabilizam por danos decorrentes do uso das informações exibidas, incluindo decisões tomadas com base em dados desatualizados, incompletos ou incorretos fornecidos pela fonte. A fonte DataJud pode apresentar atrasos, ausência de movimentações recentes ou dados incompletos.",
        },
        {
          titulo: "Caráter informativo",
          texto:
            "Os dados exibidos têm caráter exclusivamente informativo e não constituem intimação, certidão ou documento oficial. Para fins jurídicos, consulte o sistema oficial do tribunal ou o Diário de Justiça.",
        },
        {
          titulo: "Direitos autorais",
          texto:
            "As marcas, logotipos e denominações de órgãos públicos citados pertencem aos seus respectivos titulares e são referenciados apenas para identificação da fonte dos dados.",
        },
      ]}
    />
  );
}

export function Sobre() {
  return (
    <Legal
      titulo="Sobre o DataJud"
      atualizado="24 de agosto de 2026"
      secoes={[
        {
          titulo: "O que é o DataJud",
          texto:
            "O DataJud é a Base Nacional de Dados do Poder Judiciário, mantida pelo Conselho Nacional de Justiça (CNJ). Ele consolida, de forma padronizada, informações processuais enviadas pelos tribunais brasileiros e as disponibiliza via APIs públicas para transparência e pesquisa.",
        },
        {
          titulo: "Origem dos dados",
          texto:
            "Os dados exibidos nesta aplicação provêm exclusivamente da API pública do DataJud (api-publica.datajud.cnj.jus.br). A atualização depende do envio de cada tribunal ao CNJ; a periodicidade e completude variam entre tribunais.",
        },
        {
          titulo: "Processos sigilosos",
          texto:
            "Processos com segredo de justiça ou sigilo não têm dados pessoais ou conteúdo integral expostos. O campo nivelSigilo é exibido como retornado pela fonte; detalhes podem ser ocultados pelo tribunal de origem.",
        },
        {
          titulo: "Atrasos e ausência de resultados",
          texto:
            "Movimentações muito recentes podem ainda não constar no DataJud. A ausência de resultado para um CNJ válido pode indicar que o processo não foi enviado, é sigiloso, foi arquivado ou o tribunal ainda não sincronizou. Em caso de dúvida, consulte o site oficial do tribunal.",
        },
        {
          titulo: "Responsabilidade da fonte",
          texto:
            "A integridade, exatidão e atualidade dependem dos tribunais e do CNJ. Esta aplicação não altera o conteúdo recebido, apenas sanitiza (remove documentos) e classifica movimentos para exibição.",
        },
        {
          titulo: "Caráter informativo",
          texto:
            "Esta consulta não substitui a consulta ao processo no tribunal, não gera efeitos jurídicos e não deve ser usada como única base para decisões. Link para fonte oficial é exibido quando disponível.",
        },
      ]}
    />
  );
}

export function OpenSource() {
  return (
    <Legal
      titulo="Open Source"
      atualizado="24 de agosto de 2026"
      secoes={[
        {
          titulo: "Código aberto",
          texto: (
            <p>
              Este projeto é open source. Veja e contribua no repositório oficial em{" "}
              <a
                href="https://github.com/kaykechico/consulta-processual"
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                github.com/kaykechico/consulta-processual
              </a>
              .
            </p>
          ),
        },
        {
          titulo: "Licença",
          texto:
            "O código é distribuído sob licença MIT. Você pode usar, estudar, modificar e distribuir, mantendo os avisos de copyright.",
        },
      ]}
    />
  );
}
