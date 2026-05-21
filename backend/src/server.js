import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => console.log(`Servidor iniciado na porta ${port}`));

server.requestTimeout = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 95000);
server.headersTimeout = server.requestTimeout + 5000;
server.keepAliveTimeout = 65000;
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
