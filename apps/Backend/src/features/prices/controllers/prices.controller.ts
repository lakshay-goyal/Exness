import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import { pricesService } from "../services/prices.service.js";

class PricesController {
  async getLatestPrices(req: Request, res: Response) {
    try {
      const result = await pricesService.getLatestPrices(req);

      if (!result.ok) {
        return ResponseWriter.error(res, 503, result.error);
      }

      return ResponseWriter.success(res, result.data);
    } catch (error) {
      console.error("Unable to load latest prices:", error);
      return ResponseWriter.internalServerError(
        res,
        "Unable to load latest prices",
      );
    }
  }
}

export const pricesController = new PricesController();
