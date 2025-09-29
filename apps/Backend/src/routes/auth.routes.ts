import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { nodemailerSender } from "@repo/utils";
import { v4 as uuidv4 } from "uuid";
import { config, constant, redisStreams } from "@repo/config";
import {readRedisStreams} from '../utils/readRedisStreams';

const authRouter = express.Router();

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
const readRedisStream = readRedisStreams(config.REDIS_URL);
const jwtSecret = config.JWT_SECRET;

authRouter.post("/login", async (req: Request, res: Response) => {
  const { email } = req.body;
  const userId = uuidv4();
  if (!email) return res.send("Email is required");

  try {
    const token = jwt.sign({ userId: userId, email: email }, jwtSecret);
    if (process.env.NODE_ENV == "production") {
      await nodemailerSender(email, token);
    } else {
      console.log(`${config.BACKEND_URL}/api/v1/auth/verify?token=${token}`);
    }
    res.json({ message: "Verification link send", email, token });
  } catch (error) {
    res.status(401).send(error);
  }
});

authRouter.get("/verify", async (req: Request, res: Response) => {
  const token = req.query;
  console.log(token, "token from query");
  
  const realToken = typeof token.token === "string" ? token.token : "";
  // const startTime = Date.now();

  try {
    await RedisStreams.connect();
    await readRedisStream.connect();
    const verify = jwt.verify(realToken, jwtSecret);

    if (verify) {
      res.cookie("token", realToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000 * 60 * 60, // 15 days
      });

      const userEmail = (verify as jwt.JwtPayload).email;
      const userId = (verify as jwt.JwtPayload).userId;
      console.log("Token Value: ", userEmail, userId);

      await RedisStreams.addToRedisStream(constant.redisStream, {
        function: "createUsers",
        userId,
        userEmail,
      });

      try {
        await readRedisStream.readRedisStream(
          constant.secondaryRedisStream,
          (result: any) => {
            if (result.function === "createUser") {
              if (result.message === userId) {
                console.log("user created")
                return res.redirect(config.FRONTEND_URL);
              } else {
                console.log(result.message);
                return res.send("User already existed")
              }
            }
          }
        );
      } catch (e) {
        res.status(411).json({
          message: "Trade not placed",
        });
      }

    }

    await RedisStreams.disconnect();
    return res.status(401).send("Invalid token ❌");
  } catch (err) {
    return res.status(401).send("Token expired or invalid ❌");
  }
});

export default authRouter;
