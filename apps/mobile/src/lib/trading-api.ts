import { BACKEND_URL } from "./auth-client";
import { getMobileAccessToken } from "./mobile-auth-api";

export type BackendOpenTrade = {
  orderId: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  leverage?: number;
  openPrice: number;
  currentPrice?: number;
  openTime?: string;
  takeProfit?: number | null;
  stopLoss?: number | null;
  status?: "open";
};

export type BackendClosedTrade = {
  orderId: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  leverage?: number;
  openPrice: number;
  closePrice: number;
  openTime?: string;
  closeTime?: string;
  profitLoss?: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  closeReason?: string | null;
  status?: "closed";
};

export type TradingProfileData = {
  balance: number;
  openTrades: BackendOpenTrade[];
  closedTrades: BackendClosedTrade[];
};

type BalanceResponse = {
  status?: "success" | "error";
  message?: number | string;
};

type OpenTradesResponse = {
  message?: string | BackendOpenTrade[];
};

type ClosedTradesResponse = {
  message?: BackendClosedTrade[] | string;
};

async function backendRequest<T>(path: string, token: string) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.message || body?.error || `Backend request failed: ${path}`,
    );
  }

  return (await response.json()) as T;
}

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function fetchTradingProfileData(): Promise<TradingProfileData> {
  const token = await getMobileAccessToken();

  if (!token) {
    throw new Error("No active mobile access token");
  }

  const [balanceResponse, openResponse, closedResponse] = await Promise.all([
    backendRequest<BalanceResponse>("/api/v1/balance", token),
    backendRequest<OpenTradesResponse>("/api/v1/trade/open", token),
    backendRequest<ClosedTradesResponse>("/api/v1/trade/close", token),
  ]);

  const balanceValue = Number(balanceResponse.message);

  return {
    balance: Number.isFinite(balanceValue) ? balanceValue : 0,
    openTrades: parseArray<BackendOpenTrade>(openResponse.message),
    closedTrades: parseArray<BackendClosedTrade>(closedResponse.message),
  };
}
