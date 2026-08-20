import { Router } from "express";
import type { RequestHandler } from "express";
import { consultarProcesso, healthHandler, readyHandler } from "../controllers/processo.controller";
import { rateLimitMiddleware } from "../middlewares/rateLimit";

export const apiRouter = Router();

apiRouter.post("/v1/processos/consulta", rateLimitMiddleware as RequestHandler, consultarProcesso);
apiRouter.get("/v1/processos/consulta", rateLimitMiddleware as RequestHandler, consultarProcesso);
apiRouter.get("/v1/health", healthHandler);
apiRouter.get("/v1/ready", readyHandler);
