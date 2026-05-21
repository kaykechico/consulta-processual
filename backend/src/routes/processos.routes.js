import { Router } from "express";
import { consultarProcesso } from "../controllers/processos.controller.js";
import { requestTimeoutMiddleware } from "../middleware/request-timeout.middleware.js";

const router = Router();
const consultaTimeoutMs = Number(process.env.CONSULTA_TIMEOUT_MS || 90000);

router.post("/consultar", requestTimeoutMiddleware(consultaTimeoutMs), consultarProcesso);

export default router;
