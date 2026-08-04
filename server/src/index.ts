import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env, corsOrigins } from "./config/env";
import { processoRouter } from "./routes/processo.routes";
import { errorHandler, notFound } from "./middlewares/error";

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.use("/api", processoRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API Consulta Processual em http://localhost:${env.PORT}`);
});
