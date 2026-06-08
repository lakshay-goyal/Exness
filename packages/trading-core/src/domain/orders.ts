import type { CloseReason, OpenOrder, PriceUpdate } from '@repo/types';

const calculateMargin = (quantity: number, price: number, leverage: number): number =>
  (quantity * price) / leverage;

const calculateProfitLoss = (
  order: Pick<OpenOrder, 'type' | 'quantity' | 'openPrice'>,
  closePrice: number,
): number =>
  order.type === 'buy'
    ? (closePrice - order.openPrice) * order.quantity
    : (order.openPrice - closePrice) * order.quantity;

const getExitPrice = (order: OpenOrder, priceData: PriceUpdate): number =>
  order.type === 'buy' ? priceData.bidValue : priceData.askValue;

const getCurrentOpenOrderPrice = (
  order: OpenOrder,
  priceData: PriceUpdate | undefined,
): number => {
  if (priceData === undefined) return order.openPrice;
  return getExitPrice(order, priceData);
};

const getTriggerPrice = (order: OpenOrder, priceData: PriceUpdate): number =>
  getExitPrice(order, priceData);

const determineCloseReason = (order: OpenOrder, triggerPrice: number): CloseReason | null => {
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
};

export const orderCalculator = {
  getMargin: calculateMargin,
  getProfitLoss: calculateProfitLoss,
  getCurrentOpenOrderPrice,
  getTriggerPrice,
  getCloseReason: determineCloseReason,
};
