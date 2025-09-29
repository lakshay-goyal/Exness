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

// Track latest bid/ask per symbol
const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
let bidAskMap: Record<string, { bid: number; ask: number }> = {};

// ws message
ws.on("open", function open() {
  crypto_trades.forEach((element) => {
    ws.send(`{"method":"SUBSCRIBE","params":["trade.${element}"],"id":4}`);
  });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. Compute all the values
      const decimal = 4;
      const asset = msg.data.s.toString();
      const price = Math.floor(Number(msg.data.p) * 10 ** decimal);
      const bidValue = Math.floor((price - price * 0.005) * 10 ** decimal);
      const askValue = Math.floor((price + price * 0.005) * 10 ** decimal);
      const idx = price_updates.findIndex((u) => u.asset === asset);

      // 2. Push to Redis queue
      await RedisClient.pushData(constant.redisQueue, JSON.stringify(msg));

      // 3. Send to WS through pubsub
      if (!symbols.includes(asset)) return;
      const BidAsk = {
        asset,
        bid: bidValue,
        ask: askValue,
      };
      bidAskMap[asset] = BidAsk;
      await PubsubClient.publish(constant.pubsubKey, JSON.stringify(BidAsk));

      // 4. Push data into price_updates variable.
      if (idx !== -1 && price_updates[idx]) {
        price_updates[idx].price = price;
        price_updates[idx].bidValue = bidValue;
        price_updates[idx].askValue = askValue;
        price_updates[idx].decimal = decimal;
      } else {
        price_updates.push({ asset, price, bidValue, askValue, decimal });
      }
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
  await RedisStreams.addToRedisStream  (
      constant.redisStream,
      { function:"pricePoller",message: JSON.stringify(price_updates) }
    );
}, 3000);