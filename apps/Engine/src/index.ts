import { BinanceMarketDataService } from './features/market-data/binance-market-data.service.js';
import { EngineWorker } from './engine-worker.js';

await new BinanceMarketDataService().start();
await new EngineWorker().start();
