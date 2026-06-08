import type { CloseReason, OpenOrder, PriceUpdate } from '@repo/types';
import { priceNormalizer } from './prices';

export class OrderCalculator {
  getMargin(quantity: number, price: number, leverage: number) {
    return (quantity * price) / leverage;
  }

  getProfitLoss(order: Pick<OpenOrder, 'type' | 'quantity' | 'openPrice'>, closePrice: number) {
    return order.type === 'buy'
      ? (closePrice - order.openPrice) * order.quantity
      : (order.openPrice - closePrice) * order.quantity;
  }

  getCurrentOpenOrderPrice(order: OpenOrder, priceData?: PriceUpdate) {
    if (!priceData) return order.openPrice;
    return priceNormalizer.getExitPrice(order, priceData);
  }

  getTriggerPrice(order: OpenOrder, priceData: PriceUpdate) {
    return priceNormalizer.getExitPrice(order, priceData);
  }

  getCloseReason(order: OpenOrder, triggerPrice: number): CloseReason | null {
    const takeProfit = Number(order.takeProfit);
    const stopLoss = Number(order.stopLoss);
    const hasTakeProfit = Number.isFinite(takeProfit) && takeProfit > 0;
    const hasStopLoss = Number.isFinite(stopLoss) && stopLoss > 0;

    if (order.type === 'buy') {
      if (hasStopLoss && triggerPrice <= stopLoss) return 'stop_loss';
      if (hasTakeProfit && triggerPrice >= takeProfit) return 'take_profit';
      return null;
    }

    if (hasStopLoss && triggerPrice >= stopLoss) return 'stop_loss';
    if (hasTakeProfit && triggerPrice <= takeProfit) return 'take_profit';
    return null;
  }
}

export const orderCalculator = new OrderCalculator();
