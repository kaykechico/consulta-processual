# Consulta Processual

Consulta de processos judiciais do CNJ pela API pública do DataJud. Pesquise por número CNJ com validação de dígito verificador, cache em memória e interface minimalista.

## Stack

- **Frontend:** React + Vite + TypeScript + Axios + CSS Modules
- **Backend:** Node.js + Express + TypeScript + Axios + Zod
- **API:** DataJud (CNJ), `POST /api_publica_{sigla}/_search`

## Requisitos

- Node.js 20+ e npm

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. Crie o arquivo `.env` a partir do exemplo e ajuste se necessário:

   ```bash
   cp server/.env.example server/.env
   ```

   A chave pública do DataJud já vem preenchida no exemplo; troque por outra se quiser (rotacione em `https://datajud-wiki.cnj.jus.br/api-publica/acesso/`).

3. Suba o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173 (proxy `/api` para o backend)
   - Backend: http://localhost:3333

## Como testar

```bash
npm run lint        # ESLint (server + client)
npm run build       # TypeScript + bundle (server + client)
npm test --prefix server   # self-check dos utilitários (CNJ, tribunais)
```

Exemplo de consulta válida (TRF1):

```bash
curl "http://localhost:3333/api/processo?numero=00008323520184013202"
```

## Produção

Esta aplicação roda **apenas localmente** — o backend e a interface são feitos para servirem juntos. Para colocar em produção, rode por exemplo em um único VPS com npm e PM2:

1. Instale as dependências e compile:

   ```bash
   npm install
   npm install --prefix server --omit=dev
   npm install --prefix client
   npm run build
   ```

   O build gera `server/dist/` e `client/dist/` (estático).

2. Configure o `.env` de produção (`server/.env`) com `DATAJUD_TOKEN` real, `CORS_ORIGIN` apontando para o domínio e ajuste `DATAJUD_TIMEOUT_MS`/`CACHE_TTL_SECONDS`.

3. Inicie ambos com PM2:

   ```bash
   npm install -g pm2
   pm2 start "node server/dist/index.js" --name consulta-processual-api
   pm2 start "npx vite preview --host --port 4173 --outDir client/dist" --name consulta-processual-web
   pm2 save
   ```

   Em `/server`, o Express serve somente a API em `/api`. `client/dist` (ou o Vite preview) serve o frontend e aponta o proxy `/api` para o backend, ou o host pode ser configurado com um proxy reverso como o Nginx para unir os dois em um único domínio.

4. Opcional: suba com Nginx na frente, configurando `/` para servir `client/dist` e rodando o backend em `:3333` com proxy de `/api` para `http://localhost:3333`.

## Aspectos jurídicos e privacidade

Esta ferramenta usa a **API pública de dados abertos do DataJud (CNJ)**, que reúne informações processuais divulgadas por lei. Pontos a considerar:

- **Natureza dos dados**: a API devolve metadados de processos públicos (tribunal, classe, partes, movimentações). Não substitui os sistemas oficiais dos tribunais nem o Diário de Justiça.
- **Processos sigilosos**: processos com segredo de justiça não aparecem integralmente na API; a normalização só expõe o que o DataJud disponibiliza. O campo `nivelSigilo` é retornado conforme vier.
- **Uso responsável**: consulte apenas o necessário e não faça scraping em massa ou uso indevido dos dados (veja os termos de uso do CNJ para a API pública).
- **Privacidade no cliente**: os números consultados são guardados apenas no navegador do usuário (`localStorage`), sem envio a terceiros. Nenhum dado pessoal é armazenado no backend.
- **Chave de acesso**: o `DATAJUD_TOKEN` fica somente no servidor (`.env`) e nunca é enviado ao frontend. Em produção, esconda o token do histórico do repositório e rotacione quando necessário.
- **Este projeto é de caráter demonstrativo/informacional e não é um serviço jurídico oficial.** Verifique a informação direto na fonte oficial antes de qualquer decisão.

## Scripts

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | Sobe backend e frontend juntos (concurrently) |
| `npm run build` | Compila server (tsc) e client (vite) |
| `npm run lint` | Roda ESLint nos dois projetos |
| `npm run format` | Formata o código com Prettier |

## Configuração

Variáveis do backend (`server/.env`):

| Variável | Default | Descrição |
| -------- | ------- | --------- |
| `PORT` | `3333` | Porta do servidor Express |
| `DATAJUD_TOKEN` | (obrigatória) | Chave da API pública do DataJud |
| `DATAJUD_BASE_URL` | `https://api-publica.datajud.cnj.jus.br` | URL base da API |
| `DATAJUD_TIMEOUT_MS` | `15000` | Timeout das chamadas ao DataJud |
| `CACHE_TTL_SECONDS` | `300` | TTL do cache em memória dos resultados |
| `CORS_ORIGIN` | `http://localhost:5173` | Origens permitidas (vírgula para várias) |

A chave do DataJud vive apenas no backend, nunca é exposta ao frontend.

## Funcionalidades

- Validação do número CNJ (máscara ou digitado, com dígito verificador Módulo 97)
- Resultados normalizados: tribunal, classe, assunto, órgão julgador, competência, valor da causa, datas, partes, advogados, movimentações ordenadas por data e mais
- Cache em memória com TTL configurável
- Interface com animações em CSS, historico de consultas recentes e estados de carregamento/erro/sem resultado