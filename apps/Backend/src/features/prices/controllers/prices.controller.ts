import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import { pricesService } from "../services/prices.service.js";
import { asyncHandler } from "../../../validation/error-handler.js";

class PricesController {
  getLatestPrices = asyncHandler(async (req: Request, res: Response) => {
    const result = await pricesService.getLatestPrices(req);

    if (!result.ok) {
      return ResponseWriter.error(res, 503, result.error);
    }

    return ResponseWriter.success(res, result.data);
  });
}

export const pricesController = new PricesController();
