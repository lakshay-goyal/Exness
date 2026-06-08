import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { tradeController } from "./controllers/trade.controller.js";

const tradeRouter = express.Router();

tradeRouter.get("/", (req, res) => tradeController.hello(req, res));

tradeRouter.post("/create", authMiddleware as any, (req, res) =>
  tradeController.createOrder(req, res),
);

tradeRouter.get("/open", authMiddleware as any, (req, res) =>
  tradeController.getOpenOrders(req, res),
);

tradeRouter.post("/close", authMiddleware as any, (req, res) =>
  tradeController.closeOrder(req, res),
);

tradeRouter.get("/close", authMiddleware as any, (req, res) =>
  tradeController.getCloseOrders(req, res),
);

export default tradeRouter;
