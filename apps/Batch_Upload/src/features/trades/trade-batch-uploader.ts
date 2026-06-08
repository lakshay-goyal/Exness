import { constant, config, redisClient } from '@repo/config';
import { timeScaleDB } from '@repo/timescaledb';

export class TradeBatchUploader {
  private readonly db = timeScaleDB();
  private readonly batchLimit = 100;

  async start() {
    await this.db.connect();
    await this.db.setupTimescale();

    const redis = redisClient(config.REDIS_URL);
    await redis.connect();

    let batchSize = 0;

    while (true) {
      try {
        const msg = await redis.popData(constant.redisQueue);

        if (msg) {
          await this.insertTrade(JSON.parse(msg));
          batchSize++;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (batchSize >= this.batchLimit) {
          batchSize = 0;
        }
      } catch (err) {
        console.error('Error processing trade:', err);
      }
    }
  }

  private async insertTrade(trade: any) {
    let timestamp = typeof trade.data.T === 'string' ? parseInt(trade.data.T, 10) : trade.data.T;

    if (timestamp > 4102444800000) {
      timestamp = Math.floor(timestamp / 1000);
    }

    const time = new Date(timestamp);

    if (isNaN(time.getTime()) || time.getFullYear() < 2020 || time.getFullYear() > 2100) {
      console.error(
        `⚠️ Invalid timestamp for trade: ${trade.data.T}, parsed as: ${time.toISOString()}`,
      );
      console.error('Full trade data:', JSON.stringify(trade.data));
      return;
    }

    const symbol = trade.data.s;
    const price = trade.data.p;
    const volume = trade.data.q;
    const tradeId = trade.data.t;
    const side = trade.data.m ? 'sell' : 'buy';

    await this.db.getClient().query(
      `INSERT INTO trades (time, symbol, price, volume, trade_id, side)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING;`,
      [time, symbol, price, volume, tradeId, side],
    );
  }
}
