import jwt from "jsonwebtoken";
const jwtSecret = config.JWT_SECRET;
import { config, constant } from "@repo/config";
import express, { type Request, type Response } from "express";
import { prisma } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
const tradeRouter = express.Router();

tradeRouter.get("/", (req: Request, res: Response) => {
  res.send("Hello Trade");
});

tradeRouter.post("/create", authMiddleware as any, async (req: Request, res: Response) => {
  const { symbol, type, quantity, leverage } = req.body;
  if (!symbol || !type || !quantity || !leverage) {
    return res.status(400).json({
      error: "Missing required parameters: symbol, type, quantity, leverage",
    });
  }

  const authReq = req as Request & { user?: { id: string } };
  const userId = authReq.user?.id;
  if (!userId) {
    console.error("Error: Unauthorized - userId not found for create order.");
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("Create Order Request: User ID - ", userId, ", Symbol - ", symbol, ", Type - ", type, ", Quantity - ", quantity, ", Leverage - ", leverage);

  try {
    const RedisStreams = req.app.locals.redisStreams as any;
    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "createOrder",
      userId,
      symbol,
      type,
      quantity,
      leverage,
    });

    try {
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        0
      );
      console.log("Create Order Result from Redis Stream:", result);
      if (!res.headersSent) {
        res.json({
          message: result?.message,
        });
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for create order:", e);
      return res.status(411).json({
        message: "Create Order not placed",
      });
    }
  } catch (err) {
    console.error("Error in create order endpoint:", err);
    res.status(401).send("Token expired or invalid ❌");
  }
});

tradeRouter.get("/open", authMiddleware as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as Request & { user?: { id: string } };
    const userId = authReq.user?.id;
    if (!userId) {
      console.error("Error: Unauthorized - userId not found for get open orders.");
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("Get Open Orders Request: User ID - ", userId);

    const RedisStreams = req.app.locals.redisStreams as any;
    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "getOpenOrder",
      userId,
    });

    try {
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        0
      );
      console.log("Open Orders Result from Redis Stream:", result);
      if (!res.headersSent) {
        res.json({
          message: result?.message,
        });
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for open orders:", e);
      return res.status(411).json({
        message: "Trade not placed",
      });
    }
  } catch (err) {
    console.error("Error in get open orders endpoint:", err);
    res.status(401).send("Token expired or invalid ❌");
  }
});

tradeRouter.post("/close", authMiddleware as any, async (req: Request, res: Response) => {
  const orderId = req.body.orderId;
  if (!orderId) {
    console.error("Error: Missing required parameter orderId for close order.");
    return res.status(400).json({
      error: "Missing required parameters: orderId",
    });
  }
  console.log("Close Order Request: Order ID - ", orderId);

  const authReq = req as Request & { user?: { id: string } };
  const userId = authReq.user?.id;
  if (!userId) {
    console.error("Error: Unauthorized - userId not found for close order.");
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("Close Order Request: User ID - ", userId);

  try {
    const RedisStreams = req.app.locals.redisStreams as any;
    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "createCloseOrder",
      orderId,
      userId,
    });

    try {
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        0
      );
      console.log("Close Order Result from Redis Stream:", result);
      if (result && result.function === "createCloseOrder") {
        if (result.message?.orderId == orderId) {
          if (!res.headersSent) {
            res.json({ message: result.message });
          }
        } else if (!res.headersSent) {
          console.warn("Warning: Order ID mismatch during close order.");
          res.json({ message: "Error closing order" });
        }
      } else if (!res.headersSent) {
        console.warn("Warning: Unexpected result from Redis stream for close order.");
        res.json({ message: "Error closing order" });
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for close order:", e);
      return res.status(411).json({
        message: "Trade not placed",
      });
    }
  } catch (err) {
    console.error("Error in close order endpoint:", err);
    res.status(401).send("Token expired or invalid ❌");
  }
});

tradeRouter.get("/close/:id", authMiddleware as any, async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: string } };
  const userId = authReq.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("userId from token for closed orders:", userId);

  try {
    const result = await prisma.orders.findMany({
      where: { userId: userId }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default tradeRouter;
