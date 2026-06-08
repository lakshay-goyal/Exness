import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { config, redisStreams } from "@repo/config";

import { auth } from "../features/auth/services/better-auth.js";
import { candlesService } from "../features/candles/services/candles.service.js";
import authRouter from "../routes/auth.routes.js";
import balanceRouter from "../routes/balance.routes.js";
import assetRouter from "../routes/assets.routes.js";
import candleRouter from "../routes/candles.routes.js";
import pricesRouter from "../routes/prices.routes.js";
import tradeRouter from "../features/trading/trade.routes.js";
import ResponseWriter from "../utils/response-writer.js";

export class BackendApplication {
  readonly app: Express;

  constructor() {
    this.app = express();
  }

  async configure() {
    this.configureSecurity();
    this.configureAuthAdapter();
    this.configureBodyParsing();
    await this.configureRedisStreams();
    await this.configureDatabases();
    this.configureRoutes();
    return this;
  }

  start(port = config.PORT) {
    this.app.listen(port, () => {});
  }

  private configureSecurity() {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      }),
    );

    this.app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:8000"],
          connectSrc: ["'self'", "http://localhost:8000"],
        },
      }),
    );
  }

  private configureAuthAdapter() {
    this.app.all("/api/auth/*splat", toNodeHandler(auth));
  }

  private configureBodyParsing() {
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private async configureRedisStreams() {
    const redisStreamClient = redisStreams(config.REDIS_URL);
    await redisStreamClient.connect();
    this.app.locals.redisStreams = redisStreamClient;
  }

  private async configureDatabases() {
    await candlesService.initDatabase();
  }

  private configureRoutes() {
    this.app.use("/api/v1/auth", authRouter);
    this.app.use("/api/v1/balance", balanceRouter);
    this.app.use("/api/v1/supportedAssets", assetRouter);
    this.app.use("/api/v1/candles", candleRouter);
    this.app.use("/api/v1/prices", pricesRouter);
    this.app.use("/api/v1/trade", tradeRouter);

    this.app.get("/", (_req, res) => {
      ResponseWriter.success(res, "Server Running");
    });
  }
}
