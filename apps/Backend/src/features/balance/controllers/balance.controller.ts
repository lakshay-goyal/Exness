import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import RequestReader from "../../../utils/request-reader.js";
import { balanceService } from "../services/balance.service.js";

class BalanceController {
  async getBalance(req: Request, res: Response) {
    try {
      const userId = RequestReader.getAuthenticatedUser(req)?.id;

      if (!userId) {
        return ResponseWriter.unauthorized(res, "Unauthorized");
      }

      const result = await balanceService.getBalance(userId);

      if (!result.ok) {
        return ResponseWriter.notFound(res, result.error);
      }

      return ResponseWriter.success(res, result.data);
    } catch (err: unknown) {
      console.error("Error in balance controller:", err);
      if (err instanceof Error && err.message.includes("Token")) {
        return ResponseWriter.unauthorized(res, "Token expired or invalid ❌");
      }
      return ResponseWriter.internalServerError(res, "Internal server error");
    }
  }
}

export const balanceController = new BalanceController();
