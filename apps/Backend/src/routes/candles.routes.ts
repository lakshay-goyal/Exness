import type { Request, Response } from "express";
import { Router } from "express";
import { timeScaleDB } from "@repo/config";

const client = timeScaleDB();
await client.connect();
// await db.setupTimescale();

async function RetreiveData(
  symbol: string,
  intervals: string,
  from: string,
  to: string
) {
  try {
    const table = `candles_${intervals}`;

    const query = `
  SELECT bucket AS time,
         open, high, low, close, volume, trade_count
  FROM ${table}
  WHERE symbol = $1
    AND bucket BETWEEN $2::timestamptz AND $3::timestamptz
  ORDER BY bucket ASC;
`;

    const values = [symbol, new Date(from), new Date(to)];
    const result = await client.getClient().query(query, values);
    console.log(result);

    return result.rows;
  } catch (err) {
    console.error("Error retrieving data", err);
  }
}

function getTimeRange(interval: string) {
  const to = new Date();
  let from = new Date(to); // copy

  switch (interval) {
    case "1m":
      from.setDate(to.getDate() - 1); // 1 day back
      break;
    case "5m":
      from.setDate(to.getDate() - 7); // 7 days back
      break;
    case "15m":
      from.setDate(to.getDate() - 14); // 14 days back
      break;
    case "30m":
      from.setMonth(to.getMonth() - 1); // 1 month back
      break;
    case "1h":
      from.setMonth(to.getMonth() - 3); // 3 months back
      break;
    case "4h":
      from.setFullYear(to.getFullYear() - 1); // 1 year back
      break;
    case "1d":
      from.setFullYear(to.getFullYear() - 5); // 5 years back
      break;
    default:
      from.setDate(to.getDate() - 1); // fallback 1 day
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

const candleRouter = Router();

export const getCandles = async (req: Request, res: Response) => {
  const { symbol, interval } = req.query;

  if (!symbol || !interval) {
    return res.status(400).send("Missing required query parameters");
  }

  try {
    const { from, to } = getTimeRange(interval as string);
    console.log(`symbol ${symbol} interval ${interval} from ${from} to ${to}`);

    const data = await RetreiveData(
      symbol as string,
      interval as string,
      from,
      to
    );

    res.json({
      symbol,
      interval,
      from,
      to,
      data,
    });
  } catch (err) {
    console.error("Error retrieving data", err);
    res.status(500).send("Internal server error");
  }
};

// Add the candles endpoint route
candleRouter.get("/", getCandles);

export default candleRouter;
