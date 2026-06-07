import { prices, type Prices } from "../state/prices.js";
import { openOrders } from "../state/orders.js";
import { closeOpenOrder } from "../orders/close-order.handler.js";
import {
  marketSymbolMapper,
  orderCalculator,
  priceNormalizer,
} from "@repo/trading-core";

function updatePrices(newData: Prices[]) {
  newData.forEach((item) => {
    priceNormalizer.upsertPrice(prices, item);
  });
}

async function closeTriggeredOrders(updatedAssets: Set<string>) {
  const ordersToCheck = [...openOrders].filter((order) =>
    updatedAssets.has(marketSymbolMapper.getPriceAssetName(order.symbol))
  );

  for (const order of ordersToCheck) {
    const priceAssetName = marketSymbolMapper.getPriceAssetName(order.symbol);
    const priceData = prices.find((p) => p.asset === priceAssetName);
    if (!priceData) continue;

    const triggerPrice = orderCalculator.getTriggerPrice(order, priceData);
    const closeReason = orderCalculator.getCloseReason(order, triggerPrice);
    if (!closeReason) continue;


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
}
