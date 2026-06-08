import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import RequestReader from "../../../utils/request-reader.js";
import { balanceService } from "../services/balance.service.js";
import { asyncHandler } from "../../../validation/error-handler.js";

class BalanceController {
  getBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = RequestReader.getAuthenticatedUser(req)?.id;

    if (!userId) {
      return ResponseWriter.unauthorized(res, "Unauthorized");
    }

    const result = await balanceService.getBalance(userId);

    if (!result.ok) {
      return ResponseWriter.notFound(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  });
}

export const balanceController = new BalanceController();
