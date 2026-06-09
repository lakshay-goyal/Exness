import { marketSymbolMapper } from './symbols';

export const BINANCE_SPOT_WS_BASE = 'wss://stream.binance.com:9443';

export const SUPPORTED_BINANCE_SYMBOLS = ['btcusdt', 'ethusdt', 'solusdt'] as const;

export type BinanceSymbol = (typeof SUPPORTED_BINANCE_SYMBOLS)[number];

export interface ParsedLivePrice {
  asset: string;
  symbol: string;
  bid: number;
  ask: number;
  price: number;
}

export const getBinanceCombinedBookTickerUrl = (): string => {
  const streams = SUPPORTED_BINANCE_SYMBOLS.map((symbol) => `${symbol}@bookTicker`).join('/');
  return `${BINANCE_SPOT_WS_BASE}/stream?streams=${streams}`;
};

export const binanceSymbolToAppAsset = (symbol: string): string =>
  marketSymbolMapper.getCanonicalLiveAssetSymbol(symbol);

export const parseBinanceBookTickerMessage = (raw: unknown): ParsedLivePrice | null => {
  if (!raw || typeof raw !== 'object') return null;

  const message = raw as { stream?: string; data?: Record<string, unknown> };
  const eventData = message.data ?? (raw as Record<string, unknown>);

  const symbol = String(eventData.s ?? '').toUpperCase();
  if (!symbol) return null;

  const bid = Number(eventData.b);
  const ask = Number(eventData.a);
  if (![bid, ask].every(Number.isFinite) || bid <= 0 || ask <= 0) return null;

  const price = (bid + ask) / 2;

  return {
    asset: binanceSymbolToAppAsset(symbol),
    symbol,
    bid,
    ask,
    price,
  };
};
