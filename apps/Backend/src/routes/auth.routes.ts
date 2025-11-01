import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { nodemailerSender } from "@repo/utils";
import { v4 as uuidv4 } from "uuid";
import { config, constant } from "@repo/config";
import { prisma } from "@repo/db";

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

  try {
    const verify = jwt.verify(realToken, jwtSecret);

    if (verify) {
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

authRouter.post("/verify-user", async (req: Request, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const verify = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    
    if (!verify) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const userEmail = verify.email;
    const userId = verify.userId;
    
    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Invalid token payload.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userID: userId },
          { email: userEmail }
        ]
      }
    });

    if (!user) {
      console.log("User not found in database, creating user:", { userId, userEmail });
      
      const RedisStreams = req.app.locals.redisStreams as ReturnType<any>;

      await RedisStreams.addToRedisStream(constant.redisStream, {
        function: "createUser",
        userId,
        userEmail,
      });

      try {
        const result = await RedisStreams.readNextFromRedisStream(
          constant.secondaryRedisStream,
          5000
        );
        
        if (result && result.function === "createUser") {
          const userAfterCreation = await prisma.user.findFirst({
            where: {
              OR: [
                { userID: userId },
                { email: userEmail }
              ]
            }
          });
          
          if (userAfterCreation) {
            return res.json({
              success: true,
              exists: true,
              message: "User verified and exists in database"
            });
          }
        }
      } catch (e) {
        console.error("Error creating user:", e);
      }
      
      return res.status(404).json({ 
        error: 'User not found in database and creation is in progress.',
        exists: false
      });
    }

    return res.json({
      success: true,
      exists: true,
      message: "User verified and exists in database"
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

authRouter.post("/ensure-user", async (req: Request, res: Response) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const verify = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    
    if (!verify) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const userEmail = verify.email;
    const userId = verify.userId;
    
    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Invalid token payload.' });
    }

    console.log("Ensuring user exists:", { userId, userEmail });

    const RedisStreams = req.app.locals.redisStreams as ReturnType<any>;

    await RedisStreams.addToRedisStream(constant.redisStream, {
      function: "createUser",
      userId,
      userEmail,
    });

    try {
      const result = await RedisStreams.readNextFromRedisStream(
        constant.secondaryRedisStream,
        5000
      );
      
      if (result && result.function === "createUser") {
        return res.json({
          success: true,
          message: result.message === userId || result.message === "user Already Exist" 
            ? "User ensured in Engine and DBStorage"
            : "User creation initiated"
        });
      }
      
      return res.json({
        success: true,
        message: "User creation initiated"
      });
    } catch (e) {
      console.error("Error ensuring user:", e);
      return res.status(500).json({
        error: "Failed to ensure user, but request was sent to Engine"
      });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

export default authRouter;
