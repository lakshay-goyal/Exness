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
    "userId": "ab5c1292-530d-41ac-bfbf-e49faf01ac4d",
    "orderId": "order_98766",
    "symbol": "btc",
    "type": "buy",
    "quantity": 0.4,
    "leverage": 10,
    "openPrice": 60000,
    "openTime": new Date()
  },
    {
    "userId": "ab5c1292-530d-41ac-bfbf-e49faf01ac4d",
    "orderId": "order_98767",
    "symbol": "btc",
    "type": "buy",
    "quantity": 0.4,
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
