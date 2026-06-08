import { SUPPORTED_ASSETS } from "@repo/config";

class AssetsService {
  getSupportedAssets() {
    return SUPPORTED_ASSETS;
  }
}

export const assetsService = new AssetsService();
