import { Link } from "react-router-dom";
import styles from "./Legal.module.css";

interface LegalProps {
  titulo: string;
  atualizado: string;
  secoes: { titulo: string; texto: string }[];
}

function Legal({ titulo, atualizado, secoes }: LegalProps) {
  return (
    <main className={styles.main}>
      <Link to="/" className={styles.voltar}>
        ← Voltar
      </Link>
      <article className={styles.card}>
        <h1 className={styles.titulo}>{titulo}</h1>
        <p className={styles.atualizado}>Última atualização: {atualizado}</p>
        {secoes.map((s) => (
          <section key={s.titulo}>
            <h2 className={styles.secaoTitulo}>{s.titulo}</h2>
            <p className={styles.texto}>{s.texto}</p>
          </section>
        ))}
      </article>
    </main>
  );
}

export function Privacidade() {
  return (
    <Legal
      titulo="Política de Privacidade"
      atualizado="20 de agosto de 2026"
      secoes={[
        {
          titulo: "Dados consultados",
          texto:
            "Os números de processo consultados são enviados ao nosso servidor apenas para realização da consulta na API pública do DataJud (CNJ). O servidor não armazena nenhum dado pessoal, número de processo ou histórico de consultas em banco de dados.",
        },
        {
          titulo: "Dados locais (navegador)",
          texto:
            'O histórico de consultas recentes fica armazenado apenas no seu navegador, em localStorage. Você pode apagá-lo a qualquer momento pelo botão "Limpar todas" na página inicial ou pelas configurações do navegador. Nenhum dado sai do seu dispositivo para esse histórico.',
        },
        {
          titulo: "Serviços de terceiros",
          texto:
            "A consulta é realizada na API pública de dados abertos do DataJud, mantida pelo Conselho Nacional de Justiça (CNJ). Ao consultar, os dados são tratados conforme os termos de uso dessa API.",
        },
        {
          titulo: "Segurança",
          texto:
            "A chave de acesso ao DataJud fica somente no servidor e nunca é exposta ao navegador. As comunicações são protegidas por HTTPS quando o serviço está em produção.",
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
      atualizado="20 de agosto de 2026"
      secoes={[
        {
          titulo: "Natureza do serviço",
          texto:
            "Este projeto é independente e não possui vínculo com o Conselho Nacional de Justiça, tribunais ou qualquer órgão público. Não é um serviço jurídico oficial.",
        },
        {
          titulo: "Limitação de responsabilidade",
          texto:
            "Os mantenedores não se responsabilizam por danos decorrentes do uso das informações exibidas, incluindo decisões tomadas com base em dados desatualizados, incompletos ou incorretos fornecidos pela fonte.",
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
