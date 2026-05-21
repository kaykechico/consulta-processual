export function requestTimeoutMiddleware(timeoutMs = 90000) {
  return function requestTimeout(req, res, next) {
    const controller = new AbortController();
    req.consultaTimeoutSignal = controller.signal;

    const timeoutId = setTimeout(() => {
      controller.abort();

      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: "TEMPO_LIMITE_REQUISICAO",
          message:
            "O tempo limite para conclusão da consulta foi excedido. Realize nova tentativa."
        });
      }
    }, timeoutMs);

    const clearTimeoutId = () => clearTimeout(timeoutId);
    res.on("finish", clearTimeoutId);
    res.on("close", clearTimeoutId);

    next();
  };
}
