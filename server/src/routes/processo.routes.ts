import { Router } from "express";
import type { RequestHandler } from "express";
import {
  consultarProcesso,
  consultarProcessoPorParam,
  listarTribunais,
  healthHandler,
  readyHandler,
} from "../controllers/processo.controller";
import { openapiHandler } from "../openapi";
import { rateLimitMiddleware } from "../middlewares/rateLimit";

export const apiRouter = Router();

apiRouter.get("/v1/processos", rateLimitMiddleware as RequestHandler, consultarProcesso);
apiRouter.post("/v1/processos", rateLimitMiddleware as RequestHandler, consultarProcesso);
apiRouter.get(
  "/v1/processos/:numero",
  rateLimitMiddleware as RequestHandler,
  consultarProcessoPorParam
);
apiRouter.get("/v1/tribunais", listarTribunais);
apiRouter.get("/v1/health", healthHandler);
apiRouter.get("/v1/ready", readyHandler);
apiRouter.get("/v1/openapi.json", openapiHandler);
