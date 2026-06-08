import express from "express";
import { assetsController } from "../features/assets/controllers/assets.controller.js";

const assetRouter = express.Router();

assetRouter.get("/", assetsController.getSupportedAssets);

export default assetRouter;
