import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import { config, constant, redisStreams } from "@repo/config";

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

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

    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "getBalance",
      userId,
    });

    try {
      await RedisStreams.readRedisStream(
        constant.secondaryRedisStream,
        (payload: any) => {
          console.log(payload.message / 100);
          if (payload.function === "getBalance") {
            if (payload.message > 0) {
              if (!res.headersSent) {
                return res.json({
                  status: "success",
                  message: payload.message,
                });
              }
            } else {
              console.log("Check", payload, userId);
              if (!res.headersSent) {
                return res.json({
                  status: "exists",
                  message: "User already existed ❌",
                });
              }
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

export default balanceRouter;
