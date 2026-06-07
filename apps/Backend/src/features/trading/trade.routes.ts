import express, { type Request, type Response } from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { getEngineStreamClient } from "../../infrastructure/redis/engine-stream.service.js";
import { tradeInputService } from "./services/trade-input.service.js";
import type { AuthenticatedRequest } from "../auth/types/auth-request.js";
import { parseStreamMessage } from "../../shared/streams/stream-message.js";

const tradeRouter = express.Router();

function getAuthenticatedUserId(req: Request) {
  return (req as AuthenticatedRequest).user?.id;
}

function timeoutAfter(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

tradeRouter.get("/", (req: Request, res: Response) => {
  res.send("Hello Trade");
});

tradeRouter.post("/create", authMiddleware as any, async (req: Request, res: Response) => {
  const validatedInput = tradeInputService.validateCreateOrder(req.body);

  if (!validatedInput.ok) {
    return res.status(400).json({ error: validatedInput.error });
  }

  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    console.error("Error: Unauthorized - userId not found for create order.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const orderPayload = {
    function: "createOrder",
    userId,
    ...validatedInput.value,
  };


  try {
    const engineStreamClient = getEngineStreamClient(req);
    const requestId = await engineStreamClient.sendToEngine(orderPayload);
    const result = await Promise.race([
      engineStreamClient.readEngineResponse(requestId, 5000),
      timeoutAfter(3000, "Order creation request timed out after 3 seconds"),
    ]) as any;

    if (!result) {
      return res.status(408).json({
        error: "Request timeout: No response received within 3 seconds",
        message: "Order creation request timed out. The order may have been cancelled.",
        timeout: true,
      });
    }


    if (result.function !== "createOrder") {
      return res.status(500).json({
        error: "Unexpected response from Engine",
        message: "Failed to create order",
      });
    }

    const orderResult = parseStreamMessage<Record<string, any>>(result.message, {});

    if (orderResult.error || !orderResult.success) {
      return res.status(400).json({
        error: orderResult.error || "Failed to create order",
        message: orderResult.error || "Failed to create order",
      });
    }

    return res.json({
      message: orderResult.message || "Order created successfully",
      orderId: orderResult.orderId,
    });
  } catch (error) {
    console.error("Error in create order endpoint:", error);

    if (error instanceof Error && error.message.includes("timed out")) {
      return res.status(408).json({
        error: "Request timeout: Order creation took longer than 3 seconds",
        message: "Order creation request timed out. The order may have been cancelled.",
        timeout: true,
      });
    }

    return res.status(500).json({
      error: "Failed to read response from Engine",
      message: "Failed to create order",
    });
  }
});

tradeRouter.get("/open", authMiddleware as any, async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    console.error("Error: Unauthorized - userId not found for get open orders.");
    return res.status(401).json({ error: "Unauthorized" });
  }


  try {
    const { response } = await getEngineStreamClient(req).request({
      function: "getOpenOrder",
      userId,
    });


    if (response?.function === "getOpenOrder") {
      return res.json({ message: response.message });
    }

    console.warn("Unexpected response structure for open orders:", response);
    return res.json({ message: JSON.stringify([]) });
  } catch (error) {
    console.error("Error reading from secondary Redis stream for open orders:", error);
    return res.status(500).json({
      error: "Failed to fetch open orders",
      message: JSON.stringify([]),
    });
  }
});

tradeRouter.post("/close", authMiddleware as any, async (req: Request, res: Response) => {
  const orderId = req.body.orderId;
  if (!orderId) {
    console.error("Error: Missing required parameter orderId for close order.");
    return res.status(400).json({ error: "Missing required parameters: orderId" });
  }

  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    console.error("Error: Unauthorized - userId not found for close order.");
    return res.status(401).json({ error: "Unauthorized" });
  }


  try {
    const { response } = await getEngineStreamClient(req).request({
      function: "createCloseOrder",
      orderId,
      userId,
    });


    if (response?.function !== "createCloseOrder") {
      return res.status(500).json({ error: "Failed to close order" });
    }

    const orderData = parseStreamMessage<Record<string, any>>(response.message, {});

    if (orderData.error) {
      return res.status(400).json({
        error: orderData.error,
        message: orderData.error,
      });
    }

    if (orderData.orderId !== orderId) {
      console.warn("Warning: Order ID mismatch during close order.");
      return res.status(400).json({ error: "Order ID mismatch" });
    }

    return res.json({
      message: "Order closed successfully",
      order: orderData,
    });
  } catch (error) {
    console.error("Error in close order endpoint:", error);
    return res.status(500).json({
      error: "Failed to close order",
      message: "Internal server error",
    });
  }
});

tradeRouter.get("/close", authMiddleware as any, async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    console.error("Error: Unauthorized - userId not found for get close orders.");
    return res.status(401).json({ error: "Unauthorized" });
  }


  try {
    const { response } = await getEngineStreamClient(req).request({
      function: "getCloseOrders",
      userId,
    });


    if (response?.function !== "getCloseOrders") {
      return res.json({ message: [] });
    }

    const closeOrders = parseStreamMessage<unknown[]>(response.message, []);
    return res.json({ message: Array.isArray(closeOrders) ? closeOrders : [] });
  } catch (error) {
    console.error("Error reading from secondary Redis stream for close orders:", error);
    return res.status(500).json({
      error: "Failed to fetch close orders",
      message: [],
    });
  }
});

export default tradeRouter;
