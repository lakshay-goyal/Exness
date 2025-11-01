import { constant, config, redisClient } from "@repo/config";
import "dotenv/config";
import { timeScaleDB } from "@repo/timescaledb";
const db = timeScaleDB();

async function main() {
  await db.connect();
  await db.setupTimescale();

  // connect redis queue
  const RedisClient = redisClient(config.REDIS_URL);
  await RedisClient.connect();

  let BATCH_SIZE = 0;
  const BATCH_LIMIT = 100;

  while (true) {
    try {
      const msg = await RedisClient.popData(constant.redisQueue);
      
      if (msg) {
        const trade = JSON.parse(msg);
        console.log("trade", trade);
        
        const timestamp = typeof trade.data.T === 'string' ? parseInt(trade.data.T, 10) : trade.data.T;
        const time = new Date(timestamp);
        
        if (isNaN(time.getTime()) || time.getFullYear() < 2020 || time.getFullYear() > 2100) {
          console.error(`⚠️ Invalid timestamp for trade: ${trade.data.T}, parsed as: ${time.toISOString()}`);
          console.error(`Full trade data:`, JSON.stringify(trade.data));
          continue;
        }
        
        const symbol = trade.data.s;
        const price = trade.data.p;
        const volume = trade.data.q;
        const trade_id = trade.data.t;
        const side = trade.data.m ? "sell" : "buy";

        await db.getClient().query(
          `INSERT INTO trades (time, symbol, price, volume, trade_id, side)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING;`,
          [time, symbol, price, volume, trade_id, side]
        )

        BATCH_SIZE++;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (BATCH_SIZE >= BATCH_LIMIT) {
        BATCH_SIZE = 0;
      }
    } catch (err) {
      console.error("Error processing trade:", err);
    }
  }
}

main();
