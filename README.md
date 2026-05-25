# Consulta Processual

Aplicação para consultar dados públicos de processos pelo número CNJ, usando a API Pública DataJud.

## O que faz

- Valida a numeração CNJ informada.
- Identifica o tribunal quando possível.
- Exibe dados do processo e andamentos disponíveis.
- Mantém as consultas recentes no navegador.
- Trata indisponibilidade, limite de requisições e tempo de espera.

O frontend foi desenhado para uma consulta direta, sem excesso de elementos na tela. O backend centraliza a validação, o acesso ao DataJud e o tratamento de falhas.

## Tecnologias

- Frontend: React, Vite, Tailwind CSS e Axios.
- Backend: Node.js, Express e Axios.

## Rodar localmente

Em um terminal:

```bash
cd backend
npm install
npm run dev
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Endereços locais:

- Site: `http://localhost:5173`
- API: `http://localhost:3001`
- Saúde da API: `http://localhost:3001/health`

## Configuração

O backend precisa de uma chave válida do DataJud em `backend/.env`:

Configurações úteis já presentes no projeto:

- `DATAJUD_ENABLE_FALLBACK`: habilita busca em outros tribunais quando a consulta direta não encontra resultado.
- `DATAJUD_FALLBACK_CONCURRENCY`: limita a quantidade de consultas simultâneas na busca ampliada.
- `VITE_API_TIMEOUT_MS`: define quanto tempo o frontend espera pela API.

## Observação

Este projeto consulta informações públicas disponíveis na fonte oficial. Antes de utilizá-lo em produção, revise limites da API, privacidade, logs e requisitos legais aplicáveis.