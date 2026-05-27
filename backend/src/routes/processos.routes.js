import { Router } from "express";
import { consultarProcesso } from "../controllers/processos.controller.js";
import { requestTimeoutMiddleware } from "../middleware/request-timeout.middleware.js";
import { parseIntegerEnv } from "../utils/env.js";

const router = Router();
const consultaTimeoutMs = parseIntegerEnv(process.env.CONSULTA_TIMEOUT_MS, 90000, { min: 1000, max: 300000 });

router.post("/consultar", requestTimeoutMiddleware(consultaTimeoutMs), consultarProcesso);

export default router;
