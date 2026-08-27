# Consulta Processual

Aplicação web e API HTTP para consultar processos judiciais brasileiros pelo número CNJ. O backend consulta a API pública DataJud, do Conselho Nacional de Justiça (CNJ), e o frontend apresenta os dados em uma interface adaptada para desktop e celular.

## O que a aplicação faz

- Aceita números CNJ com ou sem máscara.
- Valida o número e identifica o tribunal correspondente.
- Consulta dados públicos no DataJud.
- Exibe informações do processo, partes, assuntos, datas e movimentações em uma timeline.
- Mantém um histórico opcional apenas no navegador do usuário.
- Permite filtrar movimentações por categoria e intervalo de datas.
- Oferece uma versão preparada para impressão.

A aplicação trabalha em modo de leitura. Ela não exige cadastro, não grava consultas em banco de dados e não usa cookies de rastreamento. O backend remove documentos pessoais, como CPFs, e bloqueia processos classificados como sigilosos.

## Como o projeto está organizado

O repositório usa npm workspaces e reúne três pacotes TypeScript:

- `client`: frontend em React 19, Vite e CSS Modules.
- `server`: API em Express 5, com validação, logs estruturados, cache, rate limiting e integração com o DataJud.
- `shared`: contratos, schemas Zod, tipos, validação do algoritmo CNJ módulo 97, catálogo de tribunais e classificação de movimentações.

Fluxo de uma consulta:

1. O usuário informa o número CNJ no frontend.
2. O frontend envia o número ao backend.
3. O backend valida o formato, encontra o tribunal e consulta o DataJud.
4. O backend normaliza a resposta, remove dados que não devem ser exibidos e devolve um formato único.
5. O frontend mostra o resultado e pode salvá-lo no histórico local, caso o usuário ative esse recurso.

## Requisitos

- Node.js 22.x
- npm
- Token de acesso à API pública do DataJud

## Executar em desenvolvimento

Na raiz do repositório, instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente do backend:

```bash
cp server/.env.example server/.env
```

Abra `server/.env` e preencha `DATAJUD_TOKEN` com o token do DataJud. O arquivo já traz os valores padrão das demais configurações.

Inicie frontend e backend juntos:

```bash
npm run dev
```

Acesse:

- Aplicação web: <http://localhost:5173>
- Prefixo da API: <http://localhost:3333/api>
- Health check: <http://localhost:3333/api/v1/health>
- Readiness check: <http://localhost:3333/api/v1/ready>
- Especificação OpenAPI: <http://localhost:3333/api/v1/openapi.json>

O endpoint `/health` confirma que o processo está ativo. O endpoint `/ready` confirma que o backend tem a configuração mínima para atender consultas. Sem `DATAJUD_TOKEN`, ele retorna HTTP 503.

## Comandos disponíveis

Execute os comandos na raiz:

```bash
npm test                              # Executa os testes de shared, server e client
npm run lint                          # Verifica o código com ESLint
npm run typecheck                     # Executa a verificação estrita de tipos
npm run build                         # Compila shared, server e client
npm run format                        # Formata TypeScript, TSX, CSS e JSON
npm run format:check                  # Confere a formatação sem alterar arquivos
npm run test:coverage --prefix server # Gera a cobertura do backend
```

Para iniciar somente um pacote durante o desenvolvimento:

```bash
npm run dev --prefix client
npm run dev --prefix server
```

## Executar em produção

Compile os três pacotes:

```bash
npm run build
```

Configure `NODE_ENV=production`, `DATAJUD_TOKEN`, `CORS_ORIGIN` e as demais variáveis adequadas ao ambiente. Depois inicie o backend:

```bash
npm run start --prefix server
```

Em produção, o backend pode servir os arquivos de `client/dist`. A variável `CLIENT_DIST` define esse diretório e usa `../client/dist` como valor padrão quando o servidor inicia dentro de `server`.

## Configuração do backend

Copie [`server/.env.example`](server/.env.example) para `server/.env`. Nunca versione o arquivo `.env` nem compartilhe o valor de `DATAJUD_TOKEN`.

### Variáveis principais

| Variável | Padrão | Finalidade |
| --- | --- | --- |
| `PORT` | `3333` | Porta HTTP do backend. |
| `NODE_ENV` | `development` | Ambiente de execução: `development`, `test` ou `production`. |
| `DATAJUD_TOKEN` | vazio | Token usado nas consultas ao DataJud. É obrigatório fora dos testes. |
| `DATAJUD_BASE_URL` | `https://api-publica.datajud.cnj.jus.br` | Endereço base do serviço consultado. |
| `DATAJUD_TIMEOUT_MS` | `15000` | Tempo limite de cada tentativa, em milissegundos. |
| `DATAJUD_MAX_RETRIES` | `2` | Número de novas tentativas para erros transitórios. |
| `DATAJUD_MAX_CONCURRENCY` | `4` | Número máximo de consultas simultâneas ao DataJud. |
| `CACHE_TTL_SECONDS` | `300` | Tempo de retenção de respostas encontradas, em segundos. |
| `CACHE_NEGATIVE_TTL_SECONDS` | `30` | Tempo de retenção de resultados sem processo, em segundos. |
| `CACHE_MAX_ENTRIES` | `500` | Número máximo de itens no cache em memória. |
| `RATE_LIMIT_MAX` | `30` | Número máximo de consultas por IP em uma janela. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Duração da janela do limite por IP, em milissegundos. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem permitida pelo CORS. Separe várias origens por vírgula. |
| `LOG_LEVEL` | `info` | Nível dos logs do Pino. |
| `CLIENT_DIST` | `../client/dist` | Diretório dos arquivos do frontend em produção. |

### Proxy reverso

Se o backend estiver atrás de Render, Railway, Fly.io, Nginx ou Cloudflare, ajuste `TRUST_PROXY` e, quando necessário, `TRUST_CF`. Essas variáveis permitem que o rate limiting use o IP real do cliente.

O arquivo [`server/.env.example`](server/.env.example) documenta os valores aceitos e os cenários de proxy suportados.

## API

A API usa o prefixo `/api` e retorna JSON. O número CNJ pode conter apenas os 20 dígitos ou a máscara tradicional, como `1009216-17.2023.8.26.0016`.

### Consultar um processo

As três formas abaixo executam a mesma consulta:

```http
GET /api/v1/processos?numero=1009216-17.2023.8.26.0016
```

```http
GET /api/v1/processos/1009216-17.2023.8.26.0016
```

```http
POST /api/v1/processos
Content-Type: application/json

{"numero":"1009216-17.2023.8.26.0016"}
```

Exemplo com `curl`:

```bash
curl "http://localhost:3333/api/v1/processos?numero=1009216-17.2023.8.26.0016"
```

Resposta de sucesso, HTTP 200:

```json
{
  "processo": {
    "numeroProcesso": "1009216-17.2023.8.26.0016",
    "tribunal": "Tribunal de Justiça do Estado de São Paulo",
    "grau": "G1",
    "instancia": "1º Grau",
    "classe": {
      "codigo": 7,
      "nome": "Procedimento do Juizado Especial Cível"
    },
    "assuntos": [
      {
        "codigo": 7771,
        "nome": "Obrigação de Fazer / Não Fazer"
      }
    ],
    "partes": [],
    "movimentos": [],
    "datasRelevantes": []
  }
}
```

O objeto `processo` pode conter:

- identificação: `numeroProcesso`, `tribunal`, `grau` e `instancia`;
- classificação: `classe`, `assuntos`, `competencia`, `sistema` e `formato`;
- valores e datas: `valorCausa`, `dataAjuizamento`, `dataHoraUltimaAtualizacao` e `datasRelevantes`;
- participantes: `partes`, advogados e representantes;
- andamento: `ultimaMovimentacao` e `movimentos`, incluindo data, categoria, órgão julgador e complementos.

Alguns campos são opcionais porque o DataJud pode não fornecê-los para todos os tribunais ou processos.

### Listar tribunais

```http
GET /api/v1/tribunais
```

A resposta contém `total` e a lista `tribunais`. Cada item informa o alias usado internamente, o nome do tribunal, o segmento, o código e a URL da fonte oficial quando disponível.

### Verificar o serviço

```http
GET /api/v1/health
GET /api/v1/ready
GET /api/v1/openapi.json
```

- `/health`: retorna HTTP 200 com `status: "ok"` e o tempo de atividade do processo.
- `/ready`: retorna HTTP 200 com `status: "ready"` quando a configuração mínima existe; sem token, retorna HTTP 503.
- `/openapi.json`: retorna a especificação OpenAPI 3.1.0 da API.

### Erros

Os erros seguem um formato único:

```json
{
  "error": {
    "code": "PROCESSO_NAO_ENCONTRADO",
    "message": "Nenhum processo encontrado com este número.",
    "requestId": "abc123"
  }
}
```

Os códigos mais comuns são:

- `CNJ_INVALIDO`: o número não passou na validação do CNJ.
- `NUMERO_OBRIGATORIO`: a requisição não informou o número.
- `TRIBUNAL_NAO_SUPORTADO`: o código do tribunal não está no catálogo local.
- `PROCESSO_NAO_ENCONTRADO`: o DataJud não encontrou o processo.
- `PROCESSO_SIGILOSO`: o processo tem nível de sigilo e a aplicação bloqueou a resposta.
- `RATE_LIMITED`: o cliente atingiu o limite de consultas por IP.
- `DATAJUD_*`: o backend encontrou timeout, indisponibilidade, erro de autenticação ou limite do DataJud.

O backend também envia os cabeçalhos `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` e `Retry-After` quando a rota participa do rate limiting.

## Resiliência e segurança

- O token bucket global limita o volume de requisições enviadas ao DataJud.
- O request coalescing combina consultas simultâneas para o mesmo processo em uma única chamada ao DataJud.
- O cache LRU em memória reduz consultas repetidas e usa TTL separado para resultados encontrados e não encontrados.
- O normalizador remove documentos pessoais e bloqueia processos sigilosos com HTTP 403.
- O Helmet configura CSP, HSTS em produção, proteção contra MIME sniffing, política de origem e restrições de permissões.
- O frontend usa navegação por teclado, atributos ARIA e áreas de toque adequadas para celulares.

## Privacidade, termos e limitações

Leia a [Política de Privacidade](https://consulta-processual.pages.dev/privacidade), os [Termos de Uso](https://consulta-processual.pages.dev/termos) e o [Aviso](https://consulta-processual.pages.dev/aviso) publicados pela aplicação.

O projeto tem finalidade informativa, educacional e de pesquisa técnica. Os dados exibidos dependem da disponibilidade e da qualidade das fontes oficiais do DataJud. A aplicação não substitui consulta processual oficial nem orientação jurídica.

## Licença

Distribuído sob a licença MIT. Consulte [`LICENSE`](LICENSE) para ver o texto completo.
