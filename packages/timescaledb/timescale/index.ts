import pkg from "pg";
const { Client } = pkg;
import { config } from "@repo/config";

class TimeScaleDB {
  private client: pkg.Client;

  constructor() {
    this.client = new Client({
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME,
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("✅ Connected to TimescaleDB");
    } catch (error) {
      console.error("❌ Failed to connect to TimescaleDB:", error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  async setupTimescale() {
  try {
    // Enable TimescaleDB extension
    await this.client.query("CREATE EXTENSION IF NOT EXISTS timescaledb;");

    // Create the hypertable for trades
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        time        TIMESTAMPTZ       NOT NULL,
        symbol      VARCHAR(20)       NOT NULL,
        price       NUMERIC(20,8)     NOT NULL,
        volume      NUMERIC(20,8)     NOT NULL,
        trade_id    BIGINT            NOT NULL,
        side        VARCHAR(4)        NOT NULL CHECK (side IN ('buy', 'sell')),
        PRIMARY KEY (time, symbol, trade_id)
      );
    `);

    // Convert the trades table to a hypertable
    await this.client.query(
      "SELECT create_hypertable('trades', 'time', if_not_exists => TRUE);"
    );

    // Apply best practice: Add compression policy
    // Compresses data older than 30 days to save space
    await this.client.query(`
      ALTER TABLE trades SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'symbol',
        timescaledb.compress_orderby = 'time DESC'
      );
    `);
    await this.client.query("SELECT add_compression_policy('trades', INTERVAL '30 days');");

    // Apply best practice: Add data retention policy
    // Drops chunks of data older than 90 days
    await this.client.query("SELECT add_retention_policy('trades', INTERVAL '90 days');");

    // Create an index on the symbol column for faster queries
    await this.client.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
    `);

    // Define the intervals for continuous aggregates
    const intervals = [
      { interval: "1 minute", name: "1m", start: "7 days" },
      { interval: "5 minutes", name: "5m", start: "14 days" },
      { interval: "15 minutes", name: "15m", start: "1 month" },
      { interval: "30 minutes", name: "30m", start: "2 months" },
      { interval: "1 hour", name: "1h", start: "6 months" },
      { interval: "4 hours", name: "4h", start: "1 year" },
      { interval: "1 day", name: "1d", start: "2 years" },
      { interval: "1 week", name: "1w", start: "5 years" },
      { interval: "1 month", name: "1mo", start: "10 years" },
      { interval: "1 year", name: "1y", start: "50 years" },
    ];

    // Loop through intervals to create continuous aggregates and their policies
    for (const { interval, name, start } of intervals) {
      // Create a materialized view for candles
      await this.client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS candles_${name}
        WITH (timescaledb.continuous) AS
        SELECT
          symbol,
          time_bucket('${interval}', time) AS bucket,
          FIRST(price, time) AS open,
          MAX(price) AS high,
          MIN(price) AS low,
          LAST(price, time) AS close,
          SUM(volume) AS volume,
          COUNT(*) AS trade_count
        FROM trades
        GROUP BY symbol, bucket
        WITH NO DATA;
      `);

      // Create an index for faster queries on the materialized view
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_candles_${name}_symbol_time
        ON candles_${name} (symbol, bucket DESC);
      `);

      // Check if a refresh policy already exists for the continuous aggregate
      const { rows } = await this.client.query(`
        SELECT 1 FROM timescaledb_information.jobs
        WHERE hypertable_name = 'candles_${name}'
          AND proc_name = 'policy_refresh_continuous_aggregate';
      `);

      // Add a refresh policy if one doesn't exist
      if (rows.length === 0) {
        await this.client.query(`
          SELECT add_continuous_aggregate_policy('candles_${name}',
            start_offset => INTERVAL '${start}',
            end_offset   => INTERVAL '${interval}',
            schedule_interval => INTERVAL '${interval}'
          );
        `);
        console.log(`Added refresh policy for candles_${name}`);
      }
    }

    console.log("✅ TimescaleDB setup completed!");
  } catch (error) {
    console.error("❌ Error setting up TimescaleDB:", error);
  }
}

  async disconnect() {
    await this.client.end();
    console.log("🔌 Disconnected from TimescaleDB");
  }
}

export const timeScaleDB = () => new TimeScaleDB();
