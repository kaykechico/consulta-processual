import { app, rateLimiter } from "./app";
import { env, isProduction } from "./config/env";
import { logger } from "./lib/logger";

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, ambiente: env.NODE_ENV, producao: isProduction },
    "API Consulta Processual iniciada"
  );
});

let encerrando = false;

function shutdown(signal: string): void {
  if (encerrando) return;
  encerrando = true;
  logger.info({ signal }, "recebido sinal de encerramento; parando de aceitar requisições");

  const forcar = setTimeout(() => {
    logger.error("encerramento forçado após timeout");
    process.exit(1);
  }, 10_000);
  forcar.unref();

  server.close((err) => {
    rateLimiter.dispose();
    if (err) {
      logger.error({ err }, "erro ao fechar o servidor");
      process.exit(1);
    }
    logger.info("servidor encerrado com sucesso");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
