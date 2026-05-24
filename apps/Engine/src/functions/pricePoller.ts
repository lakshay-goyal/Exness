import { prices, type Prices } from "../data/price.js";
import { openOrders } from "../data/orders.js";
import { closeOpenOrder } from "./createCloseOrder.js";

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

function getPriceAssetName(symbol: string): string {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes("BTC")) return "BTC_USDC_PERP";
  if (symbolUpper.includes("ETH")) return "ETH_USDC_PERP";
  if (symbolUpper.includes("SOL")) return "SOL_USDC_PERP";
  return symbol.toUpperCase();
}

function getTriggerPrice(order: (typeof openOrders)[number], priceData: Prices) {
  return order.type === "buy" ? priceData.bidValue : priceData.askValue;
}

function getCloseReason(order: (typeof openOrders)[number], triggerPrice: number) {
  const takeProfit = Number(order.takeProfit);
  const stopLoss = Number(order.stopLoss);
  const hasTakeProfit = Number.isFinite(takeProfit) && takeProfit > 0;
  const hasStopLoss = Number.isFinite(stopLoss) && stopLoss > 0;

  if (order.type === "buy") {
    if (hasStopLoss && triggerPrice <= stopLoss) return "stop_loss";
    if (hasTakeProfit && triggerPrice >= takeProfit) return "take_profit";
    return null;
  }

  if (hasStopLoss && triggerPrice >= stopLoss) return "stop_loss";
  if (hasTakeProfit && triggerPrice <= takeProfit) return "take_profit";
  return null;
}

async function closeTriggeredOrders(updatedAssets: Set<string>) {
  const ordersToCheck = [...openOrders].filter((order) =>
    updatedAssets.has(getPriceAssetName(order.symbol))
  );

  for (const order of ordersToCheck) {
    const priceAssetName = getPriceAssetName(order.symbol);
    const priceData = prices.find((p) => p.asset === priceAssetName);
    if (!priceData) continue;

    const triggerPrice = getTriggerPrice(order, priceData);
    const closeReason = getCloseReason(order, triggerPrice);
    if (!closeReason) continue;

    console.log("Auto-closing order from TP/SL trigger:", {
      orderId: order.orderId,
      symbol: order.symbol,
      type: order.type,
      triggerPrice,
      takeProfit: order.takeProfit,
      stopLoss: order.stopLoss,
      closeReason,
    });

    await closeOpenOrder({
      orderId: order.orderId,
      userId: order.userId,
      closeReason,
      sendResponse: false,
    });
  }
}

export async function pricePollerFunction(payload: any) {

  const results: Prices[] = JSON.parse(payload.message);
  updatePrices(results);
  await closeTriggeredOrders(new Set(results.map((result) => result.asset)));
  // console.log("Updated prices:", prices);
}
