import "dotenv/config";
import app from "./app.js";
import { parseIntegerEnv } from "./utils/env.js";

const port = parseIntegerEnv(process.env.PORT, 3001, { min: 1, max: 65535 });
const server = app.listen(port, () => console.log(`Servidor iniciado na porta ${port}`));

server.requestTimeout = parseIntegerEnv(process.env.SERVER_REQUEST_TIMEOUT_MS, 95000, { min: 1000, max: 600000 });
server.headersTimeout = server.requestTimeout + 5000;
server.keepAliveTimeout = 65000;
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
