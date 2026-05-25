# Consulta Processual

Projeto de estudo para consulta processual por número CNJ usando a API pública DataJud/CNJ.

## Objetivo

Este projeto foi criado para estudar uma arquitetura simples de consulta processual com separação entre backend e frontend:

- **Backend** em Node.js/Express para validação do número CNJ, consulta ao DataJud e tratamento de erros.
- **Frontend** em React/Vite para entrada do número processual, exibição sob demanda dos dados retornados e histórico local de consultas.

## Funcionalidades

- Validação de número CNJ com 20 dígitos.
- Detecção do tribunal com base no padrão CNJ.
- Consulta à API pública DataJud/CNJ.
- Busca ampliada em outros tribunais quando habilitada, com concorrência limitada e cancelamento após resultado útil.
- Tratamento de timeout, retry, erros transitórios e limite de requisições.
- Interface responsiva com estados de carregamento, erro e resultado.
- Histórico local de consultas recentes no navegador.
- Carregamento sob demanda dos componentes de resultado para reduzir o JavaScript inicial.

## Stack

### Backend

- Node.js
- Express
- Axios
- dotenv
- helmet
- cors
- compression
- express-rate-limit
- morgan

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- Lucide React

## Estrutura

```text
consulta-processual/
  backend/
    src/
      controllers/
      middleware/
      routes/
      services/
      utils/
  frontend/
    src/
      api/
      components/
      utils/
```

## Como rodar

### Backend

```bash
cd backend
npm install
npm run dev
```

O backend roda por padrão em:

```text
http://localhost:3001
```

Healthcheck:

```text
http://localhost:3001/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend roda por padrão em:

```text
http://localhost:5173
```

## Configuração relevante

- `frontend/.env`: `VITE_API_TIMEOUT_MS=100000`, dando margem para a resposta controlada do backend.
- `frontend/vite.config.js` e `frontend/nginx.conf`: proxy de `/api` configurado para até 100 segundos.
- `backend/.env`: `DATAJUD_ENABLE_FALLBACK` controla a busca ampliada e `DATAJUD_FALLBACK_CONCURRENCY` limita consultas paralelas.

## Otimizações aplicadas

- Telas de resumo e andamentos são carregadas somente após uma consulta bem-sucedida.
- Formatadores e tabelas de tradução/correção são reutilizados durante a renderização.
- A busca ampliada cancela chamadas paralelas restantes quando encontra um resultado ou erro impeditivo.


## Observação

Este é um projeto de estudo. Antes de qualquer uso em produção, revise limites da API, tratamento de dados, logs, privacidade e requisitos legais aplicáveis.
