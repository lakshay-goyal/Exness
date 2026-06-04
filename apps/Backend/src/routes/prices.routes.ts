import express, { type Request, type Response } from "express";
import { constant } from "@repo/config";

const pricesRouter = express.Router();

type StreamPriceUpdate = {
  asset?: string;
  price?: number | string;
  bidValue?: number | string;
  askValue?: number | string;
  bid?: number | string;
  ask?: number | string;
  decimal?: number;
};

function normalizePriceValue(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  return numericValue > 10_000_000 ? numericValue / 100_000_000 : numericValue;
}

function parsePricePollerMessage(message: unknown): StreamPriceUpdate[] {
  if (Array.isArray(message)) {
    return message as StreamPriceUpdate[];
  }

  if (typeof message !== "string" || !message.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(message);
    return Array.isArray(parsed) ? (parsed as StreamPriceUpdate[]) : [];
  } catch {
    return [];
  }
}

pricesRouter.get("/latest", async (req: Request, res: Response) => {
  try {
    const redisStreams = req.app.locals.redisStreams;

    if (!redisStreams?.readLatestFromRedisStream) {
      return res.status(503).json({ error: "Price stream is not available" });
    }

    const latestMessages = await redisStreams.readLatestFromRedisStream(
      constant.redisStream,
      50,
    );
    const priceMessage = latestMessages.find(
      (message: any) => message?.function === "pricePoller",
    );

    if (!priceMessage) {
      return res.json({ data: [] });
    }

    const data = parsePricePollerMessage(priceMessage.message)
      .map((item) => {
        const bid = normalizePriceValue(item.bidValue ?? item.bid);
        const ask = normalizePriceValue(item.askValue ?? item.ask);
        const price =
          normalizePriceValue(item.price) ??
          (bid !== null && ask !== null ? (bid + ask) / 2 : null);

        if (!item.asset || bid === null || ask === null || price === null) {
          return null;
        }

        return {
          asset: String(item.asset).toUpperCase(),
          price,
          bid,
          ask,
          decimal: item.decimal ?? 8,
        };
      })
      .filter(Boolean);

    return res.json({ data });
  } catch (error) {
    console.error("Unable to load latest prices:", error);
    return res.status(500).json({ error: "Unable to load latest prices" });
  }
});

export default pricesRouter;
