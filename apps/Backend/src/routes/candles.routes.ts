import type { Request, Response } from "express";
import { Router } from "express";
import { timeScaleDB } from "@repo/timescaledb";

const candleRouter = Router();
const client = timeScaleDB();
const allowedIntervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

const symbolMapping: Record<string, string> = {
  BTCUSDT: "BTC_USDC_PERP",
  ETHUSDT: "ETH_USDC_PERP",
  SOLUSDT: "SOL_USDC_PERP",
  BTC_USDC_PERP: "BTC_USDC_PERP",
  ETH_USDC_PERP: "ETH_USDC_PERP",
  SOL_USDC_PERP: "SOL_USDC_PERP",
};

async function initDB() {
  try {
    await client.connect();
    // Ensure schema, hypertable, views and policies exist
    await client.setupTimescale();
  } catch (err) {
    console.error("Failed to connect to TimescaleDB:", err);
    process.exit(1);
  }
}
initDB();

// Helper: compute default time range for a given interval
function getTimeRange(interval: string) {
  const to = new Date();
  const from = new Date(to); // copy

  switch (interval) {
    case "1m":
      from.setDate(to.getDate() - 1);
      break;
    case "5m":
      from.setDate(to.getDate() - 7);
      break;
    case "15m":
      from.setDate(to.getDate() - 14);
      break;
    case "30m":
      from.setMonth(to.getMonth() - 1);
      break;
    case "1h":
      from.setMonth(to.getMonth() - 3);
      break;
    case "4h":
      from.setFullYear(to.getFullYear() - 1);
      break;
    case "1d":
      from.setFullYear(to.getFullYear() - 5);
      break;
    default:
      from.setDate(to.getDate() - 1);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

// Helper function to get interval in PostgreSQL interval format
function getIntervalPostgresFormat(interval: string): string {
  const intervalMap: Record<string, string> = {
    "1m": "1 minute",
    "5m": "5 minutes",
    "15m": "15 minutes",
    "30m": "30 minutes",
    "1h": "1 hour",
    "4h": "4 hours",
    "1d": "1 day",
  };
  return intervalMap[interval] || "1 minute";
}

async function retrieveDataFromTrades(
  symbol: string,
  interval: string,
  from: string,
  to: string,
) {
  const intervalFormat = getIntervalPostgresFormat(interval);

  const query = `
    SELECT 
      time_bucket('${intervalFormat}', time) AS time,
      FIRST(price, time) AS open,
      MAX(price) AS high,
      MIN(price) AS low,
      LAST(price, time) AS close,
      SUM(volume) AS volume,
      COUNT(*) AS trade_count
    FROM trades
    WHERE UPPER(symbol) = UPPER($1)
      AND time BETWEEN $2::timestamptz AND $3::timestamptz
    GROUP BY time_bucket('${intervalFormat}', time)
    ORDER BY time_bucket('${intervalFormat}', time) ASC;
  `;

  const result = await client.getClient().query(query, [symbol, from, to]);

  if (result.rows.length === 0) {
    const queryNoDate = `
      SELECT 
        time_bucket('${intervalFormat}', time) AS time,
        FIRST(price, time) AS open,
        MAX(price) AS high,
        MIN(price) AS low,
        LAST(price, time) AS close,
        SUM(volume) AS volume,
        COUNT(*) AS trade_count
      FROM trades
      WHERE UPPER(symbol) = UPPER($1)
      GROUP BY time_bucket('${intervalFormat}', time)
      ORDER BY time_bucket('${intervalFormat}', time) DESC
      LIMIT 500;
    `;
    const resultNoDate = await client.getClient().query(queryNoDate, [symbol]);
    if (resultNoDate.rows.length > 0) {
      return resultNoDate.rows.reverse();
    }
  }

  return result.rows;
}

async function retrieveData(
  symbol: string,
  interval: string,
  from: string,
  to: string,
) {
  try {
    const table = `candles_${interval}`;
    try {
      await client
        .getClient()
        .query(
          `CALL refresh_continuous_aggregate('candles_${interval}', $1::timestamptz, $2::timestamptz);`,
          [from, to],
        );
    } catch (e: any) {
      console.warn(
        `⚠️ Refresh aggregate failed for ${table}:`,
        e?.message || e,
      );
    }

    const query = `
      SELECT bucket AS time,
             open, high, low, close, volume, trade_count
      FROM ${table}
      WHERE UPPER(symbol) = UPPER($1)
        AND bucket BETWEEN $2::timestamptz AND $3::timestamptz
      ORDER BY bucket ASC;
    `;

    const values = [symbol, from, to];
    const result = await client.getClient().query(query, values);

    if (result.rows.length > 0) {
      return result.rows;
    }

    const queryNoDate = `
      SELECT bucket AS time,
             open, high, low, close, volume, trade_count
      FROM ${table}
      WHERE UPPER(symbol) = UPPER($1)
      ORDER BY bucket DESC
      LIMIT 500;
    `;
    const resultNoDate = await client.getClient().query(queryNoDate, [symbol]);
    if (resultNoDate.rows.length > 0) {
      return resultNoDate.rows.reverse();
    }

    const checkQuery = `
      SELECT COUNT(*) as count, MIN(time) as min_time, MAX(time) as max_time
      FROM trades
      WHERE UPPER(symbol) = UPPER($1);
    `;
    const checkResult = await client.getClient().query(checkQuery, [symbol]);
    const fallbackData = await retrieveDataFromTrades(
      symbol,
      interval,
      from,
      to,
    );
    if (fallbackData.length > 0) {
      return fallbackData;
    }

    return [];
  } catch (err: any) {
    console.error("Error retrieving candle data:", err?.message || err);
    try {
      return await retrieveDataFromTrades(symbol, interval, from, to);
    } catch (fallbackErr: any) {
      console.error(
        "Fallback query also failed:",
        fallbackErr?.message || fallbackErr,
      );
      throw err;
    }
  }
}

const getCandles = async (req: Request, res: Response) => {
  const { symbol, interval } = req.query;

  if (!symbol || !interval) {
    return res.status(400).json({
      error: "Missing required query parameters: symbol and interval",
    });
  }

  if (!allowedIntervals.includes(interval as string)) {
    return res.status(400).json({
      error: "Invalid interval value",
      allowedIntervals,
    });
  }

  try {
    const inputSymbol = (symbol as string).toUpperCase();
    const dbSymbol = symbolMapping[inputSymbol] || inputSymbol;

    const { from, to } = getTimeRange(interval as string);

    const data = await retrieveData(dbSymbol, interval as string, from, to);

    return res.json({
      symbol: inputSymbol,
      dbSymbol,
      interval,
      from,
      to,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("Error in getCandles handler:", err?.message || err);
    return res.status(500).json({
      error: "Internal server error",
      message: err?.message || "Unknown error",
    });
  }
};

const getDiagnostics = async (req: Request, res: Response) => {
  try {
    const totalResult = await client
      .getClient()
      .query(`SELECT COUNT(*) as total FROM trades;`);

    const symbolsResult = await client.getClient().query(`
      SELECT symbol, COUNT(*) as count, MIN(time) as earliest, MAX(time) as latest
      FROM trades
      GROUP BY symbol
      ORDER BY symbol;
    `);

    const aggregatesResult = await client.getClient().query(`
      SELECT view_name, materialized_only
      FROM timescaledb_information.continuous_aggregates
      WHERE view_name LIKE 'candles_%'
      ORDER BY view_name;
    `);

    const sampleResult = await client.getClient().query(`
      SELECT time, symbol, price, volume
      FROM trades
      ORDER BY time DESC
      LIMIT 5;
    `);

    return res.json({
      totalTrades: totalResult.rows[0]?.total || 0,
      symbols: symbolsResult.rows,
      continuousAggregates: aggregatesResult.rows,
      recentTrades: sampleResult.rows,
    });
  } catch (err: any) {
    console.error("Error in diagnostics:", err);
    return res.status(500).json({ error: err?.message || "Unknown error" });
  }
};

const refreshAggregates = async (req: Request, res: Response) => {
  try {
    const result = await client.refreshAllContinuousAggregates();
    return res.json({
      success: true,
      message: "Continuous aggregates refresh completed",
      ...result,
    });
  } catch (err: any) {
    console.error("Error refreshing aggregates:", err);
    return res.status(500).json({
      error: "Failed to refresh aggregates",
      message: err?.message || "Unknown error",
    });
  }
};

candleRouter.get("/", getCandles);
candleRouter.get("/diagnostics", getDiagnostics);
candleRouter.post("/refresh", refreshAggregates);

export default candleRouter;
