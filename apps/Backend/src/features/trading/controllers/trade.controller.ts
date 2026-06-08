import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import RequestReader from "../../../utils/request-reader.js";
import { tradeService } from "../services/trade.service.js";

class TradeController {
  hello(_req: Request, res: Response) {
    return ResponseWriter.success(res, "Hello Trade");
  }

  async createOrder(req: Request, res: Response) {
    const userId = RequestReader.getAuthenticatedUser(req)?.id;

    if (!userId) {
      console.error("Error: Unauthorized - userId not found for create order.");
      return ResponseWriter.unauthorized(res, "Unauthorized");
    }

    const result = await tradeService.createOrder(req, userId, req.body);

    if (!result.ok) {
      if ("timeout" in result && result.timeout) {
        return ResponseWriter.error(res, 408, result.error);
      }
      if (
        result.error.includes("Missing required") ||
        result.error.includes("Failed to create order") ||
        result.error.includes("Order")
      ) {
        return ResponseWriter.badRequest(res, result.error);
      }
      if (result.error.includes("Unexpected response")) {
        return ResponseWriter.internalServerError(res, result.error);
      }
      return ResponseWriter.badRequest(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async getOpenOrders(req: Request, res: Response) {
    const userId = RequestReader.getAuthenticatedUser(req)?.id;

    if (!userId) {
      console.error(
        "Error: Unauthorized - userId not found for get open orders.",
      );
      return ResponseWriter.unauthorized(res, "Unauthorized");
    }

    const result = await tradeService.getOpenOrders(req, userId);

    if (!result.ok) {
      return ResponseWriter.internalServerError(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async closeOrder(req: Request, res: Response) {
    const orderId = RequestReader.getBodyField<string>(req, "orderId");
    const userId = RequestReader.getAuthenticatedUser(req)?.id;

    if (!orderId) {
      console.error(
        "Error: Missing required parameter orderId for close order.",
      );
      return ResponseWriter.badRequest(
        res,
        "Missing required parameters: orderId",
      );
    }

    if (!userId) {
      console.error("Error: Unauthorized - userId not found for close order.");
      return ResponseWriter.unauthorized(res, "Unauthorized");
    }

    const result = await tradeService.closeOrder(req, userId, orderId);

    if (!result.ok) {
      if (result.error === "Failed to close order") {
        return ResponseWriter.internalServerError(res, result.error);
      }
      return ResponseWriter.badRequest(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async getCloseOrders(req: Request, res: Response) {
    const userId = RequestReader.getAuthenticatedUser(req)?.id;

    if (!userId) {
      console.error(
        "Error: Unauthorized - userId not found for get close orders.",
      );
      return ResponseWriter.unauthorized(res, "Unauthorized");
    }

    const result = await tradeService.getCloseOrders(req, userId);

    if (!result.ok) {
      return ResponseWriter.internalServerError(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }
}

export const tradeController = new TradeController();
