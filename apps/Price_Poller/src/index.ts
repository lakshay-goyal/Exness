import { pubsubClient, config, redisClient } from "@repo/config";
import WebSocket from "ws";
import "dotenv/config";
import { redisStreams, constant } from "@repo/config";
import {type PriceUpdate} from "@repo/types";

// connect Websocket service
const ws = new WebSocket(config.BINANCE_WS_URL);

// connect redis pubsub
const PubsubClient = pubsubClient(config.REDIS_URL);
await PubsubClient.connect();

// connect redis queue
const RedisClient = redisClient(config.REDIS_URL);
await RedisClient.connect();

// connect redis streams
const RedisStreams = redisStreams(config.REDIS_URL);
await RedisStreams.connect();

const price_updates: PriceUpdate[] = [];
const crypto_trades = ["ETH_USDC_PERP", "SOL_USDC_PERP", "BTC_USDC_PERP"];
const binanceSymbols = ["ethusdt", "solusdt", "btcusdt"];
const usesBinanceStreams = config.BINANCE_WS_URL.includes("binance");

function toAppAsset(symbol: string) {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes("BTC")) return "BTC_USDC_PERP";
  if (symbolUpper.includes("ETH")) return "ETH_USDC_PERP";
  if (symbolUpper.includes("SOL")) return "SOL_USDC_PERP";
  return symbolUpper;
}

function upsertPrice(asset: string, price: number, bidValue: number, askValue: number) {
  if (![price, bidValue, askValue].every(Number.isFinite)) return;

  const decimal = 8;
  const idx = price_updates.findIndex((u) => u.asset === asset);
  const update = { asset, price, bidValue, askValue, decimal };

  if (idx !== -1) {
    price_updates[idx] = update;
  } else {
    price_updates.push(update);
  }
}

function buildTradeQueueMessage(msg: any, data: any, asset: string) {
  return {
    ...msg,
    data: {
      ...data,
      s: asset,
    },
  };
}

// ws message
ws.on("open", function open() {
  const params = usesBinanceStreams
    ? binanceSymbols.flatMap((symbol) => [`${symbol}@trade`, `${symbol}@bookTicker`])
    : crypto_trades.flatMap((asset) => [`trade.${asset}`, `bookTicker.${asset}`]);

  ws.send(JSON.stringify({ method: "SUBSCRIBE", params, id: 4 }));

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const eventData = msg.data ?? msg;

      if (!eventData?.s) return;

      const asset = toAppAsset(eventData.s.toString());
      if (!crypto_trades.includes(asset)) return;

      if (eventData.e === "trade" && eventData.p) {
        await RedisClient.pushData(
          constant.redisQueue,
          JSON.stringify(buildTradeQueueMessage(msg, eventData, asset))
        );

        if (!price_updates.some((u) => u.asset === asset)) {
          const tradePrice = Number(eventData.p);
          const fallbackSpread = tradePrice * 0.0001;
          upsertPrice(asset, tradePrice, tradePrice - fallbackSpread, tradePrice + fallbackSpread);
        }

        return;
      }

      if (eventData.b === undefined || eventData.a === undefined) return;

      const bidValue = Number(eventData.b);
      const askValue = Number(eventData.a);
      const price = (bidValue + askValue) / 2;

      upsertPrice(asset, price, bidValue, askValue);

      await PubsubClient.publish(
        constant.pubsubKey,
        JSON.stringify({ asset, price, bid: bidValue, ask: askValue })
      );
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});

// send data into Redis streams in every 100ms
setInterval(async () => {
  console.log(JSON.stringify(price_updates));
  if (price_updates.length === 0) return;

  await RedisStreams.addToRedisStream(
    constant.redisStream,
    { function: "pricePoller", message: JSON.stringify(price_updates) }
  );
}, 3000);
