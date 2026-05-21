# Consulta Processual

Projeto de estudo para consulta processual por número CNJ usando a API pública DataJud/CNJ.

## Objetivo

Este projeto foi criado para estudar uma arquitetura simples de consulta processual com separação entre backend e frontend:

- **Backend** em Node.js/Express para validação do número CNJ, consulta ao DataJud e tratamento de erros.
- **Frontend** em React/Vite para entrada do número processual, exibição de dados retornados e histórico local de consultas.

## Funcionalidades

- Validação de número CNJ com 20 dígitos.
- Detecção do tribunal com base no padrão CNJ.
- Consulta à API pública DataJud/CNJ.
- Busca ampliada em outros tribunais quando habilitada.
- Tratamento de timeout, retry, erros transitórios e limite de requisições.
- Interface responsiva com estados de carregamento, erro e resultado.
- Histórico local de consultas recentes no navegador.

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
- Framer Motion
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


## Observação

Este é um projeto de estudo. Antes de qualquer uso em produção, revise limites da API, tratamento de dados, logs, privacidade e requisitos legais aplicáveis.