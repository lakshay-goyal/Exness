import express from "express";
import { assetsController } from "../features/assets/controllers/assets.controller.js";

const assetRouter = express.Router();

assetRouter.get("/", (req, res) =>
  assetsController.getSupportedAssets(req, res),
);

export default assetRouter;
