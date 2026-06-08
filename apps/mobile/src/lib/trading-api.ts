import { TradingApiClient } from '@repo/api-client';
import type {
  BackendClosedTrade,
  BackendOpenTrade,
  Candle as BackendCandle,
  CandleInterval,
  CreateTradePayload,
  LatestPrice as BackendLatestPrice,
  TradingProfileData,
} from '@repo/types';
import { BACKEND_URL } from './auth-client';
import { getMobileAccessToken } from './mobile-auth-api';

export type {
  BackendCandle,
  BackendClosedTrade,
  BackendLatestPrice,
  BackendOpenTrade,
  CandleInterval,
  CreateTradePayload,
  TradingProfileData,
};

async function getRequiredMobileAccessToken() {
  const token = await getMobileAccessToken();

  if (!token) {
    throw new Error('No active mobile access token');
  }

  return token;
}

const tradingApiClient = new TradingApiClient({
  baseUrl: BACKEND_URL,
  accessToken: getRequiredMobileAccessToken,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

export function fetchTradingProfileData(): Promise<TradingProfileData> {
  return tradingApiClient.fetchTradingProfileData();
}

export function closeTrade(orderId: string) {
  return tradingApiClient.closeTrade(orderId);
}

export function createTrade(payload: CreateTradePayload) {
  return tradingApiClient.createTrade(payload);
}

export function fetchCandles(symbol: string, interval: CandleInterval): Promise<BackendCandle[]> {
  return tradingApiClient.fetchCandles(symbol, interval);
}

export function fetchLatestPrices(): Promise<BackendLatestPrice[]> {
  return tradingApiClient.fetchLatestPrices();
}
