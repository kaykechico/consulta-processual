import type { Request, Response } from "express";
import { API_ERROR_CODES } from "@consulta/shared";

const rateLimitResponseHeaders = {
  headers: {
    "X-RateLimit-Limit": { $ref: "#/components/headers/RateLimitLimit" },
    "X-RateLimit-Remaining": { $ref: "#/components/headers/RateLimitRemaining" },
    "X-RateLimit-Reset": { $ref: "#/components/headers/RateLimitReset" },
    "Retry-After": { $ref: "#/components/headers/RetryAfter" },
  },
};

const processoResponses = {
  "200": {
    description: "Processo encontrado",
    ...rateLimitResponseHeaders,
    content: {
      "application/json": { schema: { $ref: "#/components/schemas/ProcessoResponse" } },
    },
  },
  "400": { $ref: "#/components/responses/Erro" },
  "403": { $ref: "#/components/responses/Erro" },
  "404": { $ref: "#/components/responses/Erro" },
  "422": { $ref: "#/components/responses/Erro" },
  "429": { $ref: "#/components/responses/Erro" },
  "500": { $ref: "#/components/responses/Erro" },
  "502": { $ref: "#/components/responses/Erro" },
  "504": { $ref: "#/components/responses/Erro" },
};

export const openapiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Consulta Processual API",
    version: "1.0.0",
    description:
      "Consulta pública e anônima de processos judiciais por número CNJ usando dados abertos do DataJud/CNJ. Stateless, sem cadastro, apenas leitura.",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/v1/processos": {
      get: {
        summary: "Consulta por nÃºmero na query string",
        parameters: [
          {
            name: "numero",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "NÃºmero CNJ com ou sem mÃ¡scara, 20 dÃ­gitos",
          },
        ],
        responses: processoResponses,
      },
      post: {
        summary: "Consulta por nÃºmero em JSON",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["numero"],
                properties: { numero: { type: "string" } },
              },
            },
          },
        },
        responses: processoResponses,
      },
    },
    "/v1/processos/{numero}": {
      get: {
        summary: "Consulta por número na URL",
        parameters: [
          {
            name: "numero",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Número CNJ com ou sem máscara, 20 dígitos",
          },
        ],
        responses: processoResponses,
      },
    },
    "/v1/tribunais": {
      get: {
        summary: "Lista tribunais disponíveis",
        responses: {
          "200": {
            description: "Lista de tribunais",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "number" },
                    tribunais: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          alias: { type: "string" },
                          nome: { type: "string" },
                          segmento: { type: "string" },
                          codigo: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v1/health": {
      get: {
        summary: "Health check — processo vivo",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string" }, uptime: { type: "number" } },
                },
              },
            },
          },
        },
      },
    },
    "/v1/ready": {
      get: {
        summary: "Readiness — pronto para atender (não consulta DataJud)",
        responses: { "200": { description: "Ready" }, "503": { description: "Not ready" } },
      },
    },
    "/v1/openapi.json": {
      get: {
        summary: "Retorna esta especificação OpenAPI",
        responses: {
          "200": {
            description: "Especificação OpenAPI 3.1.0",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Classe: {
        type: "object",
        required: ["nome"],
        properties: {
          codigo: { type: "integer", nullable: true },
          nome: { type: "string" },
        },
      },
      Assunto: {
        type: "object",
        required: ["nome"],
        properties: {
          codigo: { type: "integer", nullable: true },
          nome: { type: "string" },
        },
      },
      OrgaoJulgador: {
        type: "object",
        required: ["nome"],
        properties: {
          codigo: { type: "integer", nullable: true },
          nome: { type: "string" },
          codigoMunicipioIBGE: { type: "integer", nullable: true },
        },
      },
      Advogado: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string" },
          numeroOAB: { type: "string", nullable: true },
        },
      },
      Representante: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string" },
        },
      },
      Parte: {
        type: "object",
        required: ["nome", "isMinisterioPublico", "advogados", "representantes"],
        properties: {
          nome: { type: "string" },
          tipoParte: { type: "string", nullable: true },
          tipoPessoa: { type: "string", nullable: true },
          isMinisterioPublico: { type: "boolean" },
          advogados: { type: "array", items: { $ref: "#/components/schemas/Advogado" } },
          representantes: { type: "array", items: { $ref: "#/components/schemas/Representante" } },
        },
      },
      Movimento: {
        type: "object",
        required: ["nome", "complementos"],
        properties: {
          codigo: { type: "integer", nullable: true },
          nome: { type: "string" },
          dataHora: { type: "string", format: "date-time", nullable: true },
          complementos: { type: "array", items: { type: "string" } },
          orgaoJulgador: { $ref: "#/components/schemas/OrgaoJulgador" },
        },
      },
      DataRelevante: {
        type: "object",
        required: ["rotulo", "valor"],
        properties: {
          rotulo: { type: "string" },
          valor: { type: "string" },
        },
      },
      Processo: {
        type: "object",
        required: [
          "numeroProcesso",
          "tribunal",
          "assuntos",
          "partes",
          "movimentos",
          "datasRelevantes",
        ],
        properties: {
          numeroProcesso: { type: "string", example: "1009216-17.2023.8.26.0016" },
          tribunal: { type: "string", example: "Tribunal de Justiça de São Paulo" },
          grau: { type: "string", nullable: true, example: "G1" },
          instancia: { type: "string", nullable: true, example: "1º Grau" },
          competencia: { type: "string", nullable: true },
          nivelSigilo: { type: "integer", nullable: true },
          valorCausa: { type: "number", nullable: true, example: 5000.0 },
          dataAjuizamento: { type: "string", format: "date-time", nullable: true },
          dataHoraUltimaAtualizacao: { type: "string", format: "date-time", nullable: true },
          classe: { $ref: "#/components/schemas/Classe" },
          assuntos: { type: "array", items: { $ref: "#/components/schemas/Assunto" } },
          orgaoJulgador: { $ref: "#/components/schemas/OrgaoJulgador" },
          sistema: {
            type: "object",
            properties: { codigo: { type: "integer" }, nome: { type: "string" } },
          },
          formato: {
            type: "object",
            properties: { codigo: { type: "integer" }, nome: { type: "string" } },
          },
          partes: { type: "array", items: { $ref: "#/components/schemas/Parte" } },
          movimentos: { type: "array", items: { $ref: "#/components/schemas/Movimento" } },
          datasRelevantes: { type: "array", items: { $ref: "#/components/schemas/DataRelevante" } },
        },
      },
      ProcessoResponse: {
        type: "object",
        required: ["processo"],
        properties: {
          processo: { $ref: "#/components/schemas/Processo" },
        },
      },
      Erro: {
        type: "object",
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", enum: Object.values(API_ERROR_CODES) },
              message: { type: "string" },
              requestId: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      Erro: {
        description: "Erro padronizado",
        headers: rateLimitResponseHeaders.headers,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Erro" },
            examples: {
              cnjInvalido: {
                value: {
                  error: {
                    code: "CNJ_INVALIDO",
                    message: "Número de CNJ inválido.",
                    requestId: "abc",
                  },
                },
              },
              naoEncontrado: {
                value: {
                  error: {
                    code: "PROCESSO_NAO_ENCONTRADO",
                    message: "Nenhum processo encontrado.",
                  },
                },
              },
            },
          },
        },
      },
    },
    headers: {
      RateLimitLimit: {
        description: "Limite de requisiÃ§Ãµes por janela.",
        schema: { type: "string" },
      },
      RateLimitRemaining: {
        description: "RequisiÃ§Ãµes restantes na janela atual.",
        schema: { type: "string" },
      },
      RateLimitReset: {
        description: "Timestamp Unix do reset da janela.",
        schema: { type: "string" },
      },
      RetryAfter: {
        description: "Segundos atÃ© uma nova tentativa.",
        schema: { type: "string" },
      },
    },
  },
};

export const openapiHandler = (_req: Request, res: Response): void => {
  res.status(200).json(openapiDocument);
};
