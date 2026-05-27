export interface OpenOrders {
  userId: string;
  orderId: string;
  symbol: "btc" | "sol" | "eth";
  type: "buy" | "sell";
  quantity: number;
  leverage: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  stippage?: number | null;
  openPrice: number;
  openTime: Date;
}
export const openOrders: OpenOrders[] = [
  {
    "userId": "5a2b9cb1-35cc-4b8b-ab93-44102f06c458",
    "orderId": "order_98766",
    "symbol": "btc",
    "type": "buy",
    "quantity": 0.8,
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
  takeProfit?: number | null;
  stopLoss?: number | null;
  stippage?: number | null;
  openPrice: number;
  closePrice: number;
  openTime: Date;
  closeTime: Date;
  profitLoss: number;
  closeReason?: "manual" | "take_profit" | "stop_loss";
}

export const closeOrders: CloseOrders[] = [];
