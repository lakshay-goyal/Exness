import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import { config, constant } from "@repo/config";

// Use shared Redis Streams client from app.locals (initialized in index.ts)

const balanceRouter = express.Router();
const jwtSecret = config.JWT_SECRET;

// balanceRouter.get("/",authMiddleware, async (req: Request, res: Response) => {
balanceRouter.get("/", async (req: Request, res: Response) => {
// const token = req.cookies.token;
  // console.log("token", token);
  // if (!token) {
  //   return res.send("No token found");
  // }

  try {
    // verify & decode token
    // console.log("token",token);
    // const decoded = jwt.verify(token, jwtSecret);
    // const userId = (decoded as jwt.JwtPayload).userId;
    const userId = '1003d930-5530-4527-a6d1-db50530316f8';
    console.log("userId", userId);

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
