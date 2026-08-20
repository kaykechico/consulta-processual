# Consulta Processual

Consulta de processos judiciais pelo número CNJ, usando a API pública do DataJud (CNJ). O frontend é React, o backend é Express e o pacote `shared/` guarda o contrato de dados usado pelos dois lados.

## Stack

- **Frontend:** React 19 + Vite + TypeScript + React Router + Axios + CSS Modules
- **Backend:** Node.js + Express 5 + TypeScript + Zod + pino
- **Compartilhado (`shared/`):** validação CNJ (dígito verificador Módulo 97), mapa de tribunais, parsing de datas, schemas Zod do contrato, classificação de movimentos
- **API:** DataJud (CNJ), `POST /api_publica_{sigla}/_search`

## Requisitos

Node.js 22+ e npm.

## Como rodar

1. Instale as dependências (raiz, `server/` e `client/`):

   ```bash
   npm install
   ```

2. Crie o `.env` do backend:

   ```bash
   cp server/.env.example server/.env
   ```

   O exemplo já traz a chave pública do DataJud.

3. Suba o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173 (proxy `/api` para o backend)
   - Backend: http://localhost:3333

## Produção

O build compila `server/dist/` e `client/dist/`. Em produção, o Express serve o frontend de `client/dist` com fallback para o SPA:

```bash
npm run build
NODE_ENV=production PORT=3333 node --env-file=server/.env server/dist/server/src/index.js
```

## API

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| `POST` | `/api/v1/processos/consulta` | Consulta por número CNJ (`{ "numero": "..." }`) |
| `GET` | `/api/v1/processos/consulta?numero=...` | Consulta por query string |
| `GET` | `/api/processo?numero=...` | Rota legada (mesma consulta) |
| `GET` | `/api/v1/health` | Health check (sem rate limit) |
| `GET` | `/api/v1/ready` | Prontidão (sem rate limit) |

Exemplo de consulta válida (TJ-SP):

```bash
curl -X POST "http://localhost:3333/api/v1/processos/consulta" \
  -H "Content-Type: application/json" \
  -d '{"numero":"10092161720238260016"}'
```

Erros seguem o formato `{ "error": { "code", "message", "requestId" } }`. Códigos: `CNJ_INVALIDO`, `TRIBUNAL_NAO_SUPORTADO`, `PROCESSO_NAO_ENCONTRADO`, `DATAJUD_TIMEOUT`, `DATAJUD_RATE_LIMITED`, `DATAJUD_INDISPONIVEL`, `DATAJUD_AUTH`, `DATAJUD_SCHEMA_INVALID`, `RATE_LIMITED`, `NUMERO_OBRIGATORIO`, `ERRO_INTERNO`, `ROTA_NAO_ENCONTRADA`.

O DTO de resposta não inclui documentos nem dados sensíveis das partes. Advogados vêm com nome, tipo e OAB.

## Frontend

Rotas:

- `/` — formulário de busca e consultas recentes (localStorage)
- `/consulta?numero=NNN` — resultado da consulta, URL compartilhável
- `/privacidade`, `/termos`, `/aviso` — páginas informativas

## Configuração

Variáveis do backend (`server/.env`):

| Variável | Default | Descrição |
| -------- | ------- | --------- |
| `PORT` | `3333` | Porta do servidor Express |
| `DATAJUD_TOKEN` | (obrigatória) | Chave da API pública do DataJud |
| `DATAJUD_BASE_URL` | `https://api-publica.datajud.cnj.jus.br` | URL base da API |
| `DATAJUD_TIMEOUT_MS` | `15000` | Timeout das chamadas ao DataJud |
| `DATAJUD_MAX_RETRIES` | `3` | Tentativas em 429/502/503/504/timeout |
| `CACHE_TTL_SECONDS` | `300` | TTL do cache em memória |
| `CACHE_NEGATIVE_TTL_SECONDS` | `60` | TTL do cache de não-encontrados |
| `CACHE_MAX_ENTRIES` | `200` | Limite de entradas do cache |
| `RATE_LIMIT_MAX` | `30` | Requisições por janela por IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Janela do rate limit |
| `CORS_ORIGIN` | `http://localhost:5173` | Origens permitidas (vírgula para várias) |
| `LOG_LEVEL` | `info` | Nível de log do pino |
| `CLIENT_DIST` | `client/dist` | Caminho do frontend compilado (produção) |

O `DATAJUD_TOKEN` vive apenas no backend. O frontend nunca o recebe.

## Privacidade

A API devolve metadados de processos públicos (tribunal, classe, partes, movimentações). Processos com segredo de justiça não aparecem integralmente; o campo `nivelSigilo` chega como vier.

Você vê o que consultou no seu próprio navegador (localStorage). O backend não guarda dados pessoais. Consulte apenas o necessário e respeite os termos de uso da API pública do CNJ.

Este projeto é demonstrativo e não substitui os sistemas oficiais dos tribunais. Confira qualquer informação na fonte oficial antes de decidir.

## Estrutura

```
shared/src/          contrato compartilhado (CNJ, tribunais, schemas, movimentos)
server/src/          API Express (client resiliente, cache, rate limit, logs)
client/src/          SPA React (consulta, URL compartilhável, recentes)
```

## Scripts

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | Sobe backend e frontend juntos (concurrently) |
| `npm run build` | Compila server (tsc) e client (vite) |
| `npm run lint` | Roda ESLint nos dois projetos |
| `npm run format` | Formata o código com Prettier |