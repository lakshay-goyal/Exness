import "dotenv/config";
import { TradeBatchUploader } from "./features/trades/trade-batch-uploader.js";

await new TradeBatchUploader().start();
