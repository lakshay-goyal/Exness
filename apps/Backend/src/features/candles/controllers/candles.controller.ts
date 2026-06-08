import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import RequestReader from "../../../utils/request-reader.js";
import { candlesService } from "../services/candles.service.js";

class CandlesController {
  async getCandles(req: Request, res: Response) {
    const symbol = RequestReader.getQueryParam(req, "symbol");
    const interval = RequestReader.getQueryParam(req, "interval");

    if (!symbol || !interval) {
      return ResponseWriter.badRequest(
        res,
        "Missing required query parameters: symbol and interval",
      );
    }

    try {
      const result = await candlesService.getCandles(symbol, interval);

      if (!result.ok) {
        return ResponseWriter.badRequest(res, result.error);
      }

      return ResponseWriter.success(res, result.data);
    } catch (err: unknown) {
      console.error(
        "Error in getCandles handler:",
        err instanceof Error ? err.message : err,
      );
      return ResponseWriter.internalServerError(
        res,
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }

  async getDiagnostics(_req: Request, res: Response) {
    try {
      const data = await candlesService.getDiagnostics();
      return ResponseWriter.success(res, data);
    } catch (err: unknown) {
      console.error("Error in diagnostics:", err);
      return ResponseWriter.internalServerError(
        res,
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }

  async refreshAggregates(_req: Request, res: Response) {
    try {
      const data = await candlesService.refreshAggregates();
      return ResponseWriter.success(res, data);
    } catch (err: unknown) {
      console.error("Error refreshing aggregates:", err);
      return ResponseWriter.internalServerError(
        res,
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }
}

export const candlesController = new CandlesController();
