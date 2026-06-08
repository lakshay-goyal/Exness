import "dotenv/config";
import WebSocket from "ws";
import {
  pubsubClient,
  config,
  redisClient,
  redisStreams,
  constant,
} from "@repo/config";
import type { PriceUpdate } from "@repo/types";

export class MarketDataPoller {
  private readonly ws = new WebSocket(config.BINANCE_WS_URL);
  private readonly pubsub = pubsubClient(config.REDIS_URL);
  private readonly redis = redisClient(config.REDIS_URL);
  private readonly streams = redisStreams(config.REDIS_URL);
  private readonly priceUpdates: PriceUpdate[] = [];
  private readonly cryptoTrades = [
    "ETH_USDC_PERP",
    "SOL_USDC_PERP",
    "BTC_USDC_PERP",
  ];
  private readonly binanceSymbols = ["ethusdt", "solusdt", "btcusdt"];
  private readonly usesBinanceStreams =
    config.BINANCE_WS_URL.includes("binance");

  async start() {
    await this.pubsub.connect();
    await this.redis.connect();
    await this.streams.connect();

    this.ws.on("open", () => this.subscribe());
    this.ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });

    setInterval(async () => {
      if (this.priceUpdates.length === 0) return;

      await this.streams.addToRedisStream(constant.redisStream, {
        function: "pricePoller",
        message: JSON.stringify(this.priceUpdates),
      });
    }, 3000);
  }

  private subscribe() {
    const params = this.usesBinanceStreams
      ? this.binanceSymbols.flatMap((symbol) => [
          `${symbol}@trade`,
          `${symbol}@bookTicker`,
        ])
      : this.cryptoTrades.flatMap((asset) => [
          `trade.${asset}`,
          `bookTicker.${asset}`,
        ]);

    this.ws.send(JSON.stringify({ method: "SUBSCRIBE", params, id: 4 }));
    this.ws.on("message", async (data) => this.handleMessage(data));
  }

  private async handleMessage(data: WebSocket.RawData) {
    try {
      const msg = JSON.parse(data.toString());
      const eventData = msg.data ?? msg;

      if (!eventData?.s) return;

      const asset = this.toAppAsset(eventData.s.toString());
      if (!this.cryptoTrades.includes(asset)) return;

      if (eventData.e === "trade" && eventData.p) {
        await this.redis.pushData(
          constant.redisQueue,
          JSON.stringify(this.buildTradeQueueMessage(msg, eventData, asset)),
        );

        if (!this.priceUpdates.some((update) => update.asset === asset)) {
          const tradePrice = Number(eventData.p);
          const fallbackSpread = tradePrice * 0.0001;
          this.upsertPrice(
            asset,
            tradePrice,
            tradePrice - fallbackSpread,
            tradePrice + fallbackSpread,
          );
        }

        return;
      }

      if (eventData.b === undefined || eventData.a === undefined) return;

      const bidValue = Number(eventData.b);
      const askValue = Number(eventData.a);
      const price = (bidValue + askValue) / 2;

      this.upsertPrice(asset, price, bidValue, askValue);

      await this.pubsub.publish(
        constant.pubsubKey,
        JSON.stringify({ asset, price, bid: bidValue, ask: askValue }),
      );
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  }

  private toAppAsset(symbol: string) {
    const symbolUpper = symbol.toUpperCase();
    if (symbolUpper.includes("BTC")) return "BTC_USDC_PERP";
    if (symbolUpper.includes("ETH")) return "ETH_USDC_PERP";
    if (symbolUpper.includes("SOL")) return "SOL_USDC_PERP";
    return symbolUpper;
  }

  private upsertPrice(
    asset: string,
    price: number,
    bidValue: number,
    askValue: number,
  ) {
    if (![price, bidValue, askValue].every(Number.isFinite)) return;

    const decimal = 8;
    const index = this.priceUpdates.findIndex(
      (update) => update.asset === asset,
    );
    const update = { asset, price, bidValue, askValue, decimal };

    if (index !== -1) {
      this.priceUpdates[index] = update;
    } else {
      this.priceUpdates.push(update);
    }
  }

  private buildTradeQueueMessage(msg: any, data: any, asset: string) {
    return {
      ...msg,
      data: {
        ...data,
        s: asset,
      },
    };
  }
}
