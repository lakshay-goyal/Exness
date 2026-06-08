import { Router } from "express";
import { candlesController } from "../features/candles/controllers/candles.controller.js";
import { validateQuery, validateBody } from "../validation/middleware.js";
import {
  GetCandlesQuerySchema,
  RefreshAggregatesSchema,
} from "../validation/schemas/candles.schemas.js";

const candleRouter = Router();

candleRouter.get("/", validateQuery(GetCandlesQuerySchema), candlesController.getCandles);

candleRouter.get("/diagnostics", candlesController.getDiagnostics);

candleRouter.post(
  "/refresh",
  validateBody(RefreshAggregatesSchema),
  candlesController.refreshAggregates,
);

export default candleRouter;
