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
  const { symbol, type, quantity, leverage, slippage, takeProfit, stopLoss } = req.body;
  if (!symbol || !type || !quantity || !leverage) {
    return res.status(400).json({
      error: "Missing required parameters: symbol, type, quantity, leverage",
    });
  }

  const quantityValue = Number(quantity);
  if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
    return res.status(400).json({
      error: "Quantity must be greater than 0",
    });
  }

  const leverageValue = Number(leverage);
  if (!Number.isInteger(leverageValue) || leverageValue <= 0) {
    return res.status(400).json({
      error: "Leverage must be a positive whole number",
    });
  }

  let slippageValue: number | undefined;
  if (slippage !== undefined && slippage !== null && slippage !== "") {
    slippageValue = Number(slippage);
    if (!Number.isFinite(slippageValue) || slippageValue < 0) {
      return res.status(400).json({
        error: "Slippage must be zero or a positive number",
      });
    }
  }

  let takeProfitValue: number | undefined;
  if (takeProfit !== undefined && takeProfit !== null && takeProfit !== "") {
    takeProfitValue = Number(takeProfit);
    if (!Number.isFinite(takeProfitValue) || takeProfitValue <= 0) {
      return res.status(400).json({
        error: "Take profit must be greater than 0",
      });
    }
  }

  let stopLossValue: number | undefined;
  if (stopLoss !== undefined && stopLoss !== null && stopLoss !== "") {
    stopLossValue = Number(stopLoss);
    if (!Number.isFinite(stopLossValue) || stopLossValue <= 0) {
      return res.status(400).json({
        error: "Stop loss must be greater than 0",
      });
    }
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
    
    // Build the order payload, only including defined values
    const orderPayload: any = {
      function: "createOrder",
      userId,
      symbol,
      type,
      quantity: quantityValue,
      leverage: leverageValue,
    };
    
    // Only add optional fields if they are provided
    if (slippageValue !== undefined) {
      orderPayload.slippage = slippageValue;
    }
    
    if (takeProfitValue !== undefined) {
      orderPayload.takeProfit = takeProfitValue;
    }
    
    if (stopLossValue !== undefined) {
      orderPayload.stopLoss = stopLossValue;
    }
    
    console.log("Sending order payload to Engine:", JSON.stringify(orderPayload));
    const streamResult = await RedisStreams.addToRedisStream(constant.redisStream, orderPayload);
    const requestId = streamResult?.requestId || orderPayload.requestId;
    
    if (!requestId) {
      console.error("Failed to get requestId from stream result");
      return res.status(500).json({ error: "Failed to generate request ID" });
    }

    console.log(`Waiting for response with requestId: ${requestId}`);

    // Create a timeout promise that rejects after 3 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Order creation request timed out after 3 seconds"));
      }, 3000);
    });

    // Race between the Redis stream read and the timeout
    try {
      // Use 5 second timeout to prevent stuck requests on rapid refreshes
      // The timeoutPromise below will still enforce 3 second limit
      const readPromise = RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        5000, // 5 second timeout (will be raced with 3s timeout below)
        { requestId: requestId } // Filter by correlation ID
      );
      
      const result = await Promise.race([readPromise, timeoutPromise]) as any;
      
      // Check if result is null (which means no message was received)
      if (!result) {
        if (!res.headersSent) {
          return res.status(408).json({
            error: "Request timeout: No response received within 3 seconds",
            message: "Order creation request timed out. The order may have been cancelled.",
            timeout: true,
          });
        }
        return;
      }
      
      console.log("Create Order Result from Redis Stream:", result);
      
      if (!res.headersSent) {
        if (result && result.function === "createOrder") {
          try {
            // Parse the message (it's JSON stringified from Engine)
            const orderResult = typeof result.message === 'string' 
              ? JSON.parse(result.message) 
              : result.message;
            
            // Check if it's an error response
            if (orderResult.error || !orderResult.success) {
              return res.status(400).json({
                error: orderResult.error || "Failed to create order",
                message: orderResult.error || "Failed to create order",
              });
            }
            
            // Success response
            res.json({
              message: orderResult.message || "Order created successfully",
              orderId: orderResult.orderId,
            });
          } catch (parseError) {
            console.error("Error parsing create order response:", parseError);
            // If it's a simple string message (legacy format)
            if (typeof result.message === 'string' && result.message) {
              res.json({
                message: result.message,
              });
            } else {
              res.status(500).json({
                error: "Failed to process create order response",
                message: "Failed to create order",
              });
            }
          }
        } else {
          console.warn("Unexpected result structure for create order:", result);
          res.status(500).json({
            error: "Unexpected response from Engine",
            message: "Failed to create order",
          });
        }
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for create order:", e);
      if (!res.headersSent) {
        // Check if it's a timeout error
        if (e instanceof Error && e.message.includes("timed out")) {
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
    const streamResult = await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "getOpenOrder",
      userId,
    });
    const requestId = streamResult?.requestId;

    if (!requestId) {
      return res.status(500).json({ error: "Failed to generate request ID" });
    }

    try {
      // Use 5 second timeout to prevent stuck requests on rapid refreshes
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        5000, // 5 second timeout
        { requestId: requestId }
      );
      console.log("Open Orders Result from Redis Stream:", result);
      if (!res.headersSent) {
        if (result && result.function === "getOpenOrder") {
          // result.message is already a JSON string from getOpenOrderFunction
          // Just pass it through to the frontend which will parse it
          res.json({
            message: result.message,
          });
        } else {
          console.warn("Unexpected response structure for open orders:", result);
          res.json({
            message: JSON.stringify([]),
          });
        }
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for open orders:", e);
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to fetch open orders",
          message: JSON.stringify([]),
        });
      }
    }
  } catch (err) {
    console.error("Error in get open orders endpoint:", err);
    if (!res.headersSent) {
      res.status(401).send("Token expired or invalid ❌");
    }
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
    const streamResult = await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "createCloseOrder",
      orderId,
      userId,
    });
    const requestId = streamResult?.requestId;

    if (!requestId) {
      return res.status(500).json({ error: "Failed to generate request ID" });
    }

    try {
      // Use 5 second timeout to prevent stuck requests on rapid refreshes
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        5000, // 5 second timeout
        { requestId: requestId }
      );
      console.log("Close Order Result from Redis Stream:", result);
      
      if (!res.headersSent) {
        if (result && result.function === "createCloseOrder") {
          // Parse the message (it's JSON stringified from Engine)
          let orderData;
          try {
            orderData = typeof result.message === 'string' 
              ? JSON.parse(result.message) 
              : result.message;
            
            // Check if it's an error response
            if (orderData.error) {
              return res.status(400).json({ 
                error: orderData.error,
                message: orderData.error 
              });
            }
            
            // Verify orderId matches
            if (orderData.orderId === orderId) {
              res.json({ 
                message: "Order closed successfully",
                order: orderData 
              });
            } else {
              console.warn("Warning: Order ID mismatch during close order.");
              res.status(400).json({ error: "Order ID mismatch" });
            }
          } catch (parseError) {
            console.error("Error parsing close order response:", parseError);
            // If it's a simple error string
            if (typeof result.message === 'string' && 
                (result.message.includes("error") || result.message.includes("Error"))) {
              return res.status(400).json({ error: result.message });
            }
            res.status(500).json({ error: "Failed to process close order response" });
          }
        } else {
          console.warn("Warning: Unexpected result from Redis stream for close order.");
          res.status(500).json({ error: "Failed to close order" });
        }
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for close order:", e);
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to close order",
          message: "Internal server error",
        });
      }
    }
  } catch (err) {
    console.error("Error in close order endpoint:", err);
    if (!res.headersSent) {
      res.status(401).send("Token expired or invalid ❌");
    }
  }
});

tradeRouter.get("/close", authMiddleware as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as Request & { user?: { id: string } };
    const userId = authReq.user?.id;
    if (!userId) {
      console.error("Error: Unauthorized - userId not found for get close orders.");
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("Get Close Orders Request: User ID - ", userId);

    const RedisStreams = req.app.locals.redisStreams as any;
    const streamResult = await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "getCloseOrders",
      userId,
    });
    const requestId = streamResult?.requestId;

    if (!requestId) {
      return res.status(500).json({ error: "Failed to generate request ID" });
    }

    try {
      // Use 5 second timeout instead of infinite wait (0) to prevent stuck requests
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        5000, // 5 second timeout
        { requestId: requestId }
      );
      console.log("Close Orders Result from Redis Stream:", result);
      if (!res.headersSent) {
        if (result && result.function === "getCloseOrders") {
          // result.message is already a JSON string from dbStorageFunction
          let closeOrders;
          try {
            closeOrders = typeof result.message === 'string' 
              ? JSON.parse(result.message) 
              : result.message;
            
            // Ensure it's an array
            if (!Array.isArray(closeOrders)) {
              console.warn("Close orders is not an array, converting to array:", closeOrders);
              closeOrders = [];
            }
          } catch (parseError) {
            console.error("Error parsing close orders message:", parseError);
            closeOrders = [];
          }
          
          res.json({
            message: closeOrders,
          });
        } else {
          console.warn("Unexpected response structure:", result);
          res.json({
            message: [],
          });
        }
      }
    } catch (e) {
      console.error("Error reading from secondary Redis stream for close orders:", e);
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to fetch close orders",
          message: [],
        });
      }
    }
  } catch (err) {
    console.error("Error in get close orders endpoint:", err);
    if (!res.headersSent) {
      res.status(401).send("Token expired or invalid ❌");
    }
  }
});

export default tradeRouter;
