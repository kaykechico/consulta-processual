import { consultarProcessoDataJud } from "../services/datajud.service.js";
import {
  detectarTribunalPorCNJ,
  formatarNumeroCNJ,
  limparNumeroCNJ,
  validarNumeroCNJ
} from "../services/cnj.service.js";
import { HttpError } from "../utils/http-error.js";

export async function consultarProcesso(req, res, next) {
  const controller = new AbortController();
  const timeoutSignal = req.consultaTimeoutSignal;
  const handleClose = () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  };
  const handleTimeout = () => controller.abort();

  res.on("close", handleClose);

  if (timeoutSignal?.aborted) {
    controller.abort();
  } else {
    timeoutSignal?.addEventListener("abort", handleTimeout, { once: true });
  }

  try {
    const numeroOriginal =
      typeof req.body?.numeroProcesso === "string"
        ? req.body.numeroProcesso.trim()
        : req.body?.numeroProcesso;

    if (typeof numeroOriginal !== "string" || !numeroOriginal) {
      throw new HttpError(
        400,
        "NUMERACAO_PROCESSUAL_INVALIDA",
        "A numeração processual informada é inválida. Informe número CNJ com 20 dígitos."
      );
    }

    const numeroLimpo = limparNumeroCNJ(numeroOriginal);

    if (!validarNumeroCNJ(numeroLimpo)) {
      throw new HttpError(
        400,
        "NUMERACAO_PROCESSUAL_INVALIDA",
        "A numeração processual informada é inválida. Informe número CNJ com 20 dígitos."
      );
    }

    const numeroFormatado = formatarNumeroCNJ(numeroLimpo);
    const tribunalDetectado = detectarTribunalPorCNJ(numeroLimpo);
    const resultado = await consultarProcessoDataJud(numeroLimpo, tribunalDetectado, controller.signal);

    if (controller.signal.aborted || res.headersSent) {
      return;
    }

    if (!resultado) {
      return res.status(404).json({
        success: false,
        error: "REGISTRO_PROCESSUAL_NAO_LOCALIZADO",
        message: "Não foram localizados registros processuais públicos para a numeração informada."
      });
    }

    return res.json({
      success: true,
      numeroFormatado,
      numeroLimpo,
      tribunalDetectado: resultado.tribunal,
      buscaAmpla: resultado.buscaAmpla,
      data: resultado.data
    });
  } catch (error) {
    if (res.headersSent) {
      return;
    }
    next(error);
  } finally {
    res.removeListener("close", handleClose);
    timeoutSignal?.removeEventListener("abort", handleTimeout);
  }
}