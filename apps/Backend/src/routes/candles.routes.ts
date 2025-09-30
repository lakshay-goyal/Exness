import type { Request, Response } from "express";
import { Router } from "express";
import { timeScaleDB } from "@repo/timescaledb";

const candleRouter = Router();
const client = timeScaleDB();
const allowedIntervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

async function initDB() {
  try {
    await client.connect();
    console.log("Connected to TimescaleDB");
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

async function retrieveData(
  symbol: string,
  interval: string,
  from: string,
  to: string
) {
  try {
    const table = `candles_${interval}`;

    const query = `
      SELECT bucket AS time,
             open, high, low, close, volume, trade_count
      FROM ${table}
      WHERE symbol = $1
        AND bucket BETWEEN $2::timestamptz AND $3::timestamptz
      ORDER BY bucket ASC;
    `;

    const values = [symbol.toUpperCase(), from, to];
    const result = await client.getClient().query(query, values);
    return result.rows;
  } catch (err) {
    console.error("Error retrieving candle data:", err);
    throw err;
  }
}

export const getCandles = async (req: Request, res: Response) => {
  const { symbol, interval } = req.query;

  if (!symbol || !interval) {
    return res.status(400).send("Missing required query parameters");
  }

  if (!allowedIntervals.includes(interval as string)) {
    return res.status(400).send("Invalid interval value");
  }

  try {
    const { from, to } = getTimeRange(interval as string);
    const data = await retrieveData(
      symbol as string,
      interval as string,
      from,
      to
    );
    console.log("Candle Data: ", data);

    return res.json({
      symbol,
      interval,
      from,
      to,
      data,
    });
  } catch (err) {
    console.error("Error in getCandles handler:", err);
    return res.status(500).send("Internal server error");
  }
};

candleRouter.get("/", getCandles);

export default candleRouter;
