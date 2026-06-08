import type { Request, Response } from 'express';
import ResponseWriter from '../../../utils/response-writer.js';
import { assetsService } from '../services/assets.service.js';
import { asyncHandler } from '../../../validation/error-handler.js';

class AssetsController {
  getSupportedAssets = asyncHandler(async (_req: Request, res: Response) => {
    const assets = assetsService.getSupportedAssets();
    return ResponseWriter.success(res, assets);
  });
}

export const assetsController = new AssetsController();
