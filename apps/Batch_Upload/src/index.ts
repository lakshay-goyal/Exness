import { constant, timeScaleDB, config, redisClient } from "@repo/config";
import "dotenv/config";

const db = timeScaleDB();

async function main() {
  await db.connect();
  await db.setupTimescale();

  // connect redis queue
  const RedisClient = redisClient(config.REDIS_URL);
  await RedisClient.connect();

  let BATCH_SIZE = 0; // current batch counter
  const BATCH_LIMIT = 100; // reset after 100 inserts

  while (true) {
    try {
      const msg = await RedisClient.popData(constant.redisQueue);
      if (msg) {
        const trade = JSON.parse(msg);

        // format Binance trade schema
        const time = new Date(trade.data.T);
        const symbol = trade.data.s;
        const price = trade.data.p;
        const volume = trade.data.q;
        const trade_id = trade.data.t;
        const side = trade.data.m ? "sell" : "buy";

        // Insert into TimescaleDB
        await db.getClient().query(
          `INSERT INTO trades (time, symbol, price, volume, trade_id, side)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING;`,
          [time, symbol, price, volume, trade_id, side]
        );

        BATCH_SIZE++;
      } else {
        // Sleep 100ms if no message in queue
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Reset batch counter after 100 inserts
      if (BATCH_SIZE >= BATCH_LIMIT) {
        BATCH_SIZE = 0;
      }
    } catch (err) {
      console.error("Error processing trade:", err);
    }
  }
}

main();
