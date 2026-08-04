import { Router } from "express";
import { getProcesso } from "../controllers/processo.controller";

export const processoRouter = Router();

processoRouter.get("/processo", getProcesso);
