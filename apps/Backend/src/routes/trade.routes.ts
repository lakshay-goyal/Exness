import jwt from "jsonwebtoken";
const jwtSecret = config.JWT_SECRET;
import { config, constant, redisStreams } from "@repo/config";
import express, { type Request, type Response } from "express";
import { prisma } from "@repo/db";
const tradeRouter = express.Router();

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

tradeRouter.get("/", (req: Request, res: Response) => {
  res.send("Hello Trade");
});

tradeRouter.post("/create", async (req: Request, res: Response) => {
  const { symbol, type, quantity, leverage } = req.body;
  if (!symbol || !type || !quantity || !leverage) {
    return res.status(400).json({
      error: "Missing required parameters: symbol, type, quantity, leverage",
    });
  }

  // const token = req.cookies.token;
  // if (!token) {
  //   return res.send("No token found");
  // }

  try {
    // const decoded = jwt.verify(token, jwtSecret);
    // const userId = (decoded as jwt.JwtPayload).userId;
    const userId = "1003d930-5530-4527-a6d1-db50530316f8";
    console.log("userId", userId);

    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "createOrder",
      userId,
      symbol,
      type,
      quantity,
      leverage,
    });

    try {
      await RedisStreams.readRedisStream(
        constant.secondaryRedisStream,
        (result: any) => {
          // const jsonString = Object.values(payload).join("");
          // const result = JSON.parse(jsonString);
          console.log("Create Order Result:", result);
          if (!res.headersSent) {
            res.json({
              message: result.message,
            });
          }
        }
      );
    } catch (e) {
      return res.status(411).json({
        message: "Create Order not placed",
      });
    }
  } catch (err) {
    res.status(401).send("Token expired or invalid ❌");
  }
});

tradeRouter.get("/open", async (req: Request, res: Response) => {
  //   const token = req.cookies.token;
  //   if (!token) {
  //     return res.send("No token found");
  //   }

  try {
    // const decoded = jwt.verify(token, jwtSecret);
    // const userId = (decoded as jwt.JwtPayload).userId;
    const userId = "1003d930-5530-4527-a6d1-db50530316f8";
    console.log("userId", userId);

    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "getOpenOrder",
      userId,
    });

    try {
      await RedisStreams.readRedisStream(
        constant.secondaryRedisStream,
        (result: any) => {
          console.log("Trade Result:", result);
          if (!res.headersSent) {
            res.json({
              message: result.message,
            });
          }
        }
      );
    } catch (e) {
      return res.status(411).json({
        message: "Trade not placed",
      });
    }
  } catch (err) {
    res.status(401).send("Token expired or invalid ❌");
  }
});

tradeRouter.post("/close", async (req: Request, res: Response) => {
  const orderId = req.body.orderId;
  if (!orderId) {
    return res.status(400).json({
      error: "Missing required parameters: orderId",
    });
  }
  console.log("orderId: ", orderId);

  //   const token = req.cookies.token;
  //   if (!token) {
  //     return res.send("No token found");
  //   }
  // const decoded = jwt.verify(token, jwtSecret);
  // const userId = (decoded as jwt.JwtPayload).userId;
  const userId = "1003d930-5530-4527-a6d1-db50530316f8";
  console.log("userId: ", userId);

  try {
    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "createCloseOrder",
      orderId,
      userId,
    });

    try {
      await RedisStreams.readRedisStream(
        constant.secondaryRedisStream,
        (result: any) => {
          console.log("Trade Result:", result);
          if (result.function === "createCloseOrder") {
            console.log("Good 1:", result.message.order);
            if (result.message.orderId == orderId) {
              console.log("Good 2:", result);
              if (!res.headersSent) {
                res.json({
                  message: result.message,
                });
              }
            } else {
              if (!res.headersSent) {
                res.json({ message: "Error closing order" });
              }
            }
          } else {
            if (!res.headersSent) {
              res.json({ message: "Error closing order" });
            }
          }
        }
      );
    } catch (e) {
      return res.status(411).json({
        message: "Trade not placed",
      });
    }
  } catch (err) {
    res.status(401).send("Token expired or invalid ❌");
  }
});

tradeRouter.get("/close/:id", async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }
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
