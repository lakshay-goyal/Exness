import { Router } from "express";
import { candlesController } from "../features/candles/controllers/candles.controller.js";

const candleRouter = Router();

candleRouter.get("/", (req, res) => candlesController.getCandles(req, res));

candleRouter.get("/diagnostics", (req, res) =>
  candlesController.getDiagnostics(req, res),
);

candleRouter.post("/refresh", (req, res) =>
  candlesController.refreshAggregates(req, res),
);

export default candleRouter;
