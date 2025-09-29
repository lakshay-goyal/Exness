export interface OpenOrders {
  userId: string;
  orderId: string;
  symbol: "btc" | "sol" | "eth";
  type: "buy" | "sell";
  quantity: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  stippage?: number;
  openPrice: number;
  openTime: Date;
}
export const openOrders: OpenOrders[] = [];

export interface CloseOrders {
  userId: string;
  orderId: string;
  symbol: "btc" | "sol" | "eth";
  type: "buy" | "sell";
  quantity: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  stippage?: number;
  openPrice: number;
  closePrice: number;
  openTime: Date;
  closeTime: Date;
  profitLoss: number;
}
