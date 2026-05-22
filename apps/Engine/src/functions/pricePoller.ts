import { prices, type Prices } from "../data/price.js";

function normalizePriceValue(value: number, scale: "trade" | "quote") {
  if (!Number.isFinite(value)) return 0;

  // Older poller messages scaled trade prices by 1e4 and bid/ask by 1e8.
  // Keep this guard so a stale poller cannot corrupt margin calculations.
  if (scale === "trade" && value > 1_000_000) return value / 10_000;
  if (scale === "quote" && value > 10_000_000) return value / 100_000_000;

  return value;
}

function normalizePriceUpdate(item: Prices): Prices {
  return {
    ...item,
    price: normalizePriceValue(Number(item.price), "trade"),
    bidValue: normalizePriceValue(Number(item.bidValue), "quote"),
    askValue: normalizePriceValue(Number(item.askValue), "quote"),
  };
}

function updatePrices(newData: Prices[]) {
  newData.forEach((item) => {
    const normalizedItem = normalizePriceUpdate(item);
    const index = prices.findIndex((p) => p.asset === normalizedItem.asset);
    if (index !== -1) {
      prices[index] = normalizedItem;
    } else {
      prices.push(normalizedItem);
    }
  });
}

export function pricePollerFunction(payload: any) {

  const results: Prices[] = JSON.parse(payload.message);
  updatePrices(results);
  // console.log("Updated prices:", prices);
}
