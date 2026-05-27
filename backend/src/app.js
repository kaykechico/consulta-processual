import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import processosRoutes from "./routes/processos.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { parseIntegerEnv, parseTrustProxyEnv } from "./utils/env.js";

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean)
  : ["http://localhost:5173"];

app.disable("x-powered-by");
app.set("trust proxy", parseTrustProxyEnv(process.env.TRUST_PROXY));

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

app.use(compression());

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400
  })
);

app.use(express.json({ limit: "128kb", type: "application/json" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const apiRateLimit = rateLimit({
  windowMs: parseIntegerEnv(process.env.RATE_LIMIT_WINDOW_MS, 60000, { min: 1000, max: 3600000 }),
  max: parseIntegerEnv(process.env.RATE_LIMIT_MAX, 60, { min: 1, max: 10000 }),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "LIMITE_REQUISICOES_EXCEDIDO",
    message: "O limite temporário de consultas foi atingido. Realize nova tentativa em instantes."
  }
});

app.use("/api/processos", apiRateLimit, processosRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "ROTA_NAO_ENCONTRADA",
    message: "Rota não encontrada."
  });
});

app.use(errorMiddleware);

export default app;
