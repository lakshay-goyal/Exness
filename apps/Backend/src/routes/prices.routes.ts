import express from "express";
import { pricesController } from "../features/prices/controllers/prices.controller.js";

const pricesRouter = express.Router();

pricesRouter.get("/latest", pricesController.getLatestPrices);

export default pricesRouter;
