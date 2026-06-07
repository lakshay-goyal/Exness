export const supportedSymbols = ["btc", "sol", "eth"] as const;
export type SupportedSymbol = (typeof supportedSymbols)[number];

export const supportedMarketAssets = [
  "BTC_USDC_PERP",
  "ETH_USDC_PERP",
  "SOL_USDC_PERP",
] as const;
export type SupportedMarketAsset = (typeof supportedMarketAssets)[number];

export const orderSides = ["buy", "sell"] as const;
export type OrderSide = (typeof orderSides)[number];

export const closeReasons = ["manual", "take_profit", "stop_loss"] as const;
export type CloseReason = (typeof closeReasons)[number];

export const candleIntervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const;
export type CandleInterval = (typeof candleIntervals)[number];

export type TradingUser = {
  userId: string;
  userEmail: string;
  balance: number;
};

export type PriceUpdate = {
  asset: string;
  price: number;
  bidValue: number;
  askValue: number;
  decimal: number;
};

export type LatestPrice = {
  asset: string;
  price: number;
  bid: number;
  ask: number;
  decimal?: number;
};

export type OpenOrder = {
  userId: string;
  orderId: string;
  symbol: SupportedSymbol;
  type: OrderSide;
  quantity: number;
  leverage: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  stippage?: number | null;
  openPrice: number;
  openTime: Date;
};

export type EnhancedOpenOrder = OpenOrder & {
  currentPrice: number;
  status: "open";
};

export type ClosedOrder = {
  orderId: string;
  userId: string;
  symbol: SupportedSymbol;
  type: OrderSide;
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
  closeReason?: CloseReason;
};

export type ClosedOrderResponse = Omit<ClosedOrder, "openTime" | "closeTime"> & {
  openTime: string | Date;
  closeTime: string | Date;
  status?: "closed";
};

export type BackendOpenTrade = {
  orderId: string;
  symbol: string;
  type: OrderSide;
  quantity: number;
  leverage?: number;
  openPrice: number;
  currentPrice?: number;
  marketPrice?: number;
  bidPrice?: number;
  askPrice?: number;
  openTime?: string;
  takeProfit?: number | null;
  stopLoss?: number | null;
  slippage?: number | null;
  stippage?: number | null;
  status?: "open";
};

export type BackendClosedTrade = {
  orderId: string;
  symbol: string;
  type: OrderSide;
  quantity: number;
  leverage?: number;
  openPrice: number;
  closePrice: number;
  openTime?: string;
  closeTime?: string;
  profitLoss?: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  slippage?: number | null;
  stippage?: number | null;
  closeReason?: string | null;
  status?: "closed";
};

export type Candle = {
  time: string;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume?: string | number;
  trade_count?: string | number;
};

export type CreateTradePayload = {
  symbol: string;
  type: OrderSide;
  quantity: number;
  leverage: number;
  slippage?: number;
  takeProfit?: number;
  stopLoss?: number;
};

export type TradingProfileData = {
  balance: number;
  openTrades: BackendOpenTrade[];
  closedTrades: BackendClosedTrade[];
};
