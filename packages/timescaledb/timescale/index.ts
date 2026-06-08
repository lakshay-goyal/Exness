import pkg from 'pg';

const { Client } = pkg;

import { config } from '@repo/config';

interface IntervalConfig {
  interval: string;
  name: string;
  start: string;
}

interface RefreshResult {
  refreshed: string[];
  errors: Array<{ aggregate: string; error: string }>;
  timeRange?: { from: string; to: string };
}

class TimeScaleDB {
  private readonly client: pkg.Client;

  constructor() {
    this.client = new Client({
      user: config.TIMESCALE_DB_USER,
      password: config.TIMESCALE_DB_PASSWORD,
      host: config.TIMESCALE_DB_HOST,
      port: config.TIMESCALE_DB_PORT,
      database: config.TIMESCALE_DB_NAME,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to TimescaleDB:', error);
      throw error;
    }
  }

  getClient(): pkg.Client {
    return this.client;
  }

  async setupTimescale(): Promise<void> {
    try {
      // Enable TimescaleDB extension
      await this.client.query('CREATE EXTENSION IF NOT EXISTS timescaledb;');

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
      await this.client.query("SELECT create_hypertable('trades', 'time', if_not_exists => TRUE);");

      // Apply best practice: Add compression policy
      // Compresses data older than 30 days to save space
      await this.client.query(`
      ALTER TABLE trades SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'symbol',
        timescaledb.compress_orderby = 'time DESC'
      );
    `);
      await this.client.query(
        "SELECT add_compression_policy('trades', INTERVAL '30 days', if_not_exists => TRUE);",
      );

      // Apply best practice: Add data retention policy
      // Drops chunks of data older than 90 days
      await this.client.query(
        "SELECT add_retention_policy('trades', INTERVAL '90 days', if_not_exists => TRUE);",
      );

      // Create an index on the symbol column for faster queries
      await this.client.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol);
    `);

      // Define the intervals for continuous aggregates
      const intervals: IntervalConfig[] = [
        { interval: '1 minute', name: '1m', start: '7 days' },
        { interval: '5 minutes', name: '5m', start: '14 days' },
        { interval: '15 minutes', name: '15m', start: '1 month' },
        { interval: '30 minutes', name: '30m', start: '2 months' },
        { interval: '1 hour', name: '1h', start: '6 months' },
        { interval: '4 hours', name: '4h', start: '1 year' },
        { interval: '1 day', name: '1d', start: '2 years' },
        { interval: '1 week', name: '1w', start: '5 years' },
        { interval: '1 month', name: '1mo', start: '10 years' },
        { interval: '1 year', name: '1y', start: '50 years' },
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

        // Add a refresh policy if one doesn't exist
        try {
          const policyCheck = await this.client.query(`
          SELECT COUNT(*) as count
          FROM timescaledb_information.jobs j
          WHERE j.proc_name = 'policy_refresh_continuous_aggregate'
            AND j.config::text LIKE '%candles_${name}%';
        `);

          const [policyCheckResult] = policyCheck.rows;
          if (policyCheckResult !== undefined && policyCheckResult.count === '0') {
            // Policy doesn't exist, create it
            await this.client.query(`
            SELECT add_continuous_aggregate_policy('candles_${name}',
              start_offset => INTERVAL '${start}',
              end_offset   => INTERVAL '${interval}',
              schedule_interval => INTERVAL '${interval}'
            );
          `);
          }
        } catch (policyError: unknown) {
          // If adding policy fails, log but don't throw (policy might already exist)
          const errorMessage = policyError instanceof Error ? policyError.message : String(policyError);
          const errorCode = (policyError as { code?: string }).code;
          
          if (errorMessage.includes('already exists') || errorCode === 'P0001') {
            // Policy already exists, ignore
          } else {
            console.warn(
              `⚠️ Could not add refresh policy for candles_${name}:`,
              errorMessage,
            );
          }
        }
      }

      // After creating all aggregates, check if there's data and refresh them
      const dataCheck = await this.client.query(
        'SELECT COUNT(*) as count, MIN(time) as min_time, MAX(time) as max_time FROM trades;',
      );
      
      const [dataCheckRow] = dataCheck.rows;
      const tradeCount = parseInt(dataCheckRow?.count ?? '0', 10);

      if (tradeCount > 0) {
        const minTime = dataCheckRow?.min_time;
        const maxTime = dataCheckRow?.max_time;

        // Refresh all aggregates with the available data range
        for (const { name } of intervals) {
          try {
            await this.client.query(
              `CALL refresh_continuous_aggregate('candles_${name}', $1::timestamptz, $2::timestamptz);`,
              [minTime, maxTime],
            );
          } catch (refreshError: unknown) {
            const refreshErrorMessage = refreshError instanceof Error ? refreshError.message : String(refreshError);
            console.warn(
              `⚠️ Could not refresh candles_${name}:`,
              refreshErrorMessage,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Error setting up TimescaleDB:', error);
    }
  }

  // Method to manually refresh all continuous aggregates
  async refreshAllContinuousAggregates(timeRange?: { from: string; to: string }): Promise<RefreshResult> {
    try {
      let from: string;
      let to: string;

      if (timeRange !== undefined) {
        ({ from, to } = timeRange);
      } else {
        // Get the full time range from trades table
        const timeRangeResult = await this.client.query(
          'SELECT MIN(time) as min_time, MAX(time) as max_time FROM trades;',
        );

        const [timeRangeRow] = timeRangeResult.rows;
        const minTime = timeRangeRow?.min_time;
        const maxTime = timeRangeRow?.max_time;
        
        if (minTime === undefined || maxTime === undefined) {
          return { refreshed: [], errors: [] };
        }

        from = minTime;
        to = maxTime;
      }

      const intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1mo', '1y'];
      const refreshed: string[] = [];
      const errors: Array<{ aggregate: string; error: string }> = [];

      for (const name of intervals) {
        try {
          await this.client.query(
            `CALL refresh_continuous_aggregate('candles_${name}', $1::timestamptz, $2::timestamptz);`,
            [from, to],
          );
          refreshed.push(`candles_${name}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({
            aggregate: `candles_${name}`,
            error: errorMessage,
          });
          console.warn(`⚠️ Failed to refresh candles_${name}:`, errorMessage);
        }
      }

      return { refreshed, errors, timeRange: { from, to } };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Error refreshing continuous aggregates:', errorMessage);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }
}

export const timeScaleDB = (): TimeScaleDB => new TimeScaleDB();
