import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { nodemailerSender } from "@repo/utils";
import { v4 as uuidv4 } from "uuid";
import { config, constant } from "@repo/config";

const authRouter = express.Router();

// Use shared Redis Streams client from app.locals (initialized in index.ts)
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
    res.json({ message: "Verification link send", email});
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
    const verify = jwt.verify(realToken, jwtSecret);

    if (verify) {
      // Removed cookie setting to rely solely on localStorage for token management
      // res.cookie("token", realToken, {
      //   httpOnly: true,
      //   sameSite: "lax",
      //   maxAge: 15 * 60 * 1000 * 60 * 60, // 15 days
      // });

      const userEmail = (verify as jwt.JwtPayload).email;
      const userId = (verify as jwt.JwtPayload).userId;
      console.log("Token Value: ", userEmail, userId);

      const RedisStreams = req.app.locals.redisStreams as ReturnType<any>;

      await RedisStreams.addToRedisStream(constant.redisStream, {
        function: "createUser",
        userId,
        userEmail,
      });

      try {
        const result = await RedisStreams.readNextFromRedisStream(
          constant.secondaryRedisStream,
          0
        );
        if (result && result.function === "createUser") {
          if (result.message === userId || result.message === "user Already Exist") {
            return res.redirect(`${config.FRONTEND_URL}/dashboard?token=${realToken}`);
          } else {
            return res.send("User already existed")
          }
        }
      } catch (e) {
        res.status(411).json({
          message: "Trade not placed",
        });
      }

    }

    return res.status(401).send("Invalid token ❌");
  } catch (err) {
    return res.status(401).send("Token expired or invalid ❌");
  }
});

export default authRouter;
