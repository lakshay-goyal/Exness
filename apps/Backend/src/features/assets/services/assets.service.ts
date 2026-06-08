import { supportedAssets } from "../../../constant/assets.js";

class AssetsService {
  getSupportedAssets() {
    return supportedAssets;
  }
}

export const assetsService = new AssetsService();
