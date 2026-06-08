import type { OpenOrder, PriceUpdate } from "@repo/types";
import { marketSymbolMapper } from "./symbols";

export class PriceNormalizer {
  normalizePriceValue(value: unknown, scale: "trade" | "quote" = "quote") {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;

    if (scale === "trade" && numericValue > 1_000_000)
      return numericValue / 10_000;
    if (scale === "quote" && numericValue > 10_000_000)
      return numericValue / 100_000_000;
    return numericValue;
  }

  normalizeStreamPriceValue(value: unknown) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return null;
    return numericValue > 10_000_000
      ? numericValue / 100_000_000
      : numericValue;
  }

  normalizePriceUpdate(item: PriceUpdate): PriceUpdate {
    return {
      ...item,
      price: this.normalizePriceValue(item.price, "trade") ?? 0,
      bidValue: this.normalizePriceValue(item.bidValue, "quote") ?? 0,
      askValue: this.normalizePriceValue(item.askValue, "quote") ?? 0,
    };
  }

  upsertPrice(prices: PriceUpdate[], item: PriceUpdate) {
    const normalizedItem = this.normalizePriceUpdate(item);
    const index = prices.findIndex(
      (price) => price.asset === normalizedItem.asset,
    );
    if (index !== -1) {
      prices[index] = normalizedItem;
    } else {
      prices.push(normalizedItem);
    }
  }

  findPriceForSymbol(prices: PriceUpdate[], symbol: string) {
    const normalizedSymbol = marketSymbolMapper.normalizeSymbol(symbol);
    const priceAssetName = marketSymbolMapper.getPriceAssetName(symbol);
    return (
      prices.find((price) => {
        if (price.asset === priceAssetName) return true;
        if (price.asset === symbol) return true;
        return price.asset?.toUpperCase() === priceAssetName.toUpperCase();
      }) ??
      prices.find((price) => price.asset?.toLowerCase() === normalizedSymbol)
    );
  }

  getExitPrice(order: OpenOrder, priceData: PriceUpdate) {
    return order.type === "buy" ? priceData.bidValue : priceData.askValue;
  }

  getEntryPrice(side: "buy" | "sell", priceData: PriceUpdate) {
    return side === "buy" ? priceData.askValue : priceData.bidValue;
  }
}

export const priceNormalizer = new PriceNormalizer();
