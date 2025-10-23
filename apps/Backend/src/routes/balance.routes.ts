import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import { config, constant } from "@repo/config";

// Use shared Redis Streams client from app.locals (initialized in index.ts)

const balanceRouter = express.Router();
const jwtSecret = config.JWT_SECRET;

balanceRouter.get("/", authMiddleware as any, async (req: Request, res: Response) => {
  try {
    console.log("Entry Balance");
    console.log("Request headers:", req.headers);
    console.log("Authorization header:", req.header('Authorization'));
    
    const authReq = req as Request & { user?: { id: string } };
    const userId = authReq.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("Balance UserID: ", userId)
    const RedisStreams = req.app.locals.redisStreams as ReturnType<any>;

    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "getBalance",
      userId,
    });

    try {
      const payload = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        0
      );

      if (!payload) {
        return res.status(504).json({ status: "timeout", message: "No data" });
      }

      if (payload.function === "getBalance") {
        if (payload.message > 0) {
          if (!res.headersSent) {
            return res.json({
              status: "success",
              message: payload.message,
            });
          }
        } else {
          if (!res.headersSent) {
            return res.json({
              status: "exists",
              message: "User already existed ❌",
            });
          }
        }
      }
    } catch (e) {
      return res.status(411).json({
        message: "Trade not placed",
      });
    }
  } catch (err) {
    res.status(401).send("Token expired or invalid ❌");
  }
});

export default balanceRouter;
