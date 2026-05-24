import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { config, redisStreams } from "@repo/config";
import helmet from "helmet";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/better-auth.js";

const app = express();
const PORT = config.PORT;

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Now, modify the CSP to be less restrictive
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:8000"], // Adjust as needed
      connectSrc: ["'self'", "http://localhost:8000"], // This is the key fix for your error
    },
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import authRouter from "./routes/auth.routes.js";
import balanceRouter from "./routes/balance.routes.js";
import assetRouter from "./routes/assets.routes.js";
import candleRouter from "./routes/candles.routes.js";
import tradeRouter from "./routes/trade.routes.js";

// Initialize a single Redis Streams client and share via app.locals
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();
app.locals.redisStreams = RedisStreams;
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/balance", balanceRouter);
app.use("/api/v1/supportedAssets", assetRouter);
app.use("/api/v1/candles", candleRouter);
app.use("/api/v1/trade", tradeRouter);

app.get("/", (req, res) => {
  res.send("Server Running");
});
app.listen(PORT, () => {
  console.log(`Server started at: ${PORT}`);
});
