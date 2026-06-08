import type { Request, Response } from 'express';
import ResponseWriter from '../../../utils/response-writer.js';
import { candlesService } from '../services/candles.service.js';
import { asyncHandler } from '../../../validation/error-handler.js';

class CandlesController {
  getCandles = asyncHandler(async (req: Request, res: Response) => {
    // Validation middleware ensures req.query has valid symbol and interval
    const { symbol, interval } = req.query as { symbol: string; interval: string };

    const result = await candlesService.getCandles(symbol, interval);

    if (!result.ok) {
      return ResponseWriter.badRequest(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  });

  getDiagnostics = asyncHandler(async (_req: Request, res: Response) => {
    const data = await candlesService.getDiagnostics();
    return ResponseWriter.success(res, data);
  });

  refreshAggregates = asyncHandler(async (req: Request, res: Response) => {
    // Validation middleware ensures req.body is valid if provided
    // Refresh aggregates can accept optional symbol, interval, and force parameters
    const { symbol, interval, force } = req.body || {};

    const data = await candlesService.refreshAggregates(symbol, interval, force);
    return ResponseWriter.success(res, data);
  });
}

export const candlesController = new CandlesController();
