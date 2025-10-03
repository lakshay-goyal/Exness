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
export const openOrders: OpenOrders[] = [
  {
    "userId": "1003d930-5530-4527-a6d1-db50530316f8",
    "orderId": "order_98765",
    "symbol": "btc",
    "type": "buy",
    "quantity": 0.5,
    "leverage": 10,
    "openPrice": 60000,
    "openTime": new Date()
  }
];

export interface CloseOrders {
  orderId: string;
  userId: string;
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
