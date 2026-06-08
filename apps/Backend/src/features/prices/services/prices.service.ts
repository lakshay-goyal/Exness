import type { Request } from "express";
import { constant } from "@repo/config";

type StreamPriceUpdate = {
  asset?: string;
  price?: number | string;
  bidValue?: number | string;
  askValue?: number | string;
  bid?: number | string;
  ask?: number | string;
  decimal?: number;
};

class PricesService {
  private normalizePriceValue(value: unknown) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;

    return numericValue > 10_000_000 ? numericValue / 100_000_000 : numericValue;
  }

  private parsePricePollerMessage(message: unknown): StreamPriceUpdate[] {
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

  async getLatestPrices(req: Request) {
    const redisStreams = req.app.locals.redisStreams;

    if (!redisStreams?.readLatestFromRedisStream) {
      return { ok: false as const, error: "Price stream is not available" };
    }

    const latestMessages = await redisStreams.readLatestFromRedisStream(
      constant.redisStream,
      50,
    );
    const priceMessage = latestMessages.find(
      (message: { function?: string }) => message?.function === "pricePoller",
    );

    if (!priceMessage) {
      return { ok: true as const, data: [] };
    }

    const data = this.parsePricePollerMessage(priceMessage.message)
      .map((item) => {
        const bid = this.normalizePriceValue(item.bidValue ?? item.bid);
        const ask = this.normalizePriceValue(item.askValue ?? item.ask);
        const price =
          this.normalizePriceValue(item.price) ??
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

    return { ok: true as const, data };
  }
}

export const pricesService = new PricesService();
