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
  slippage?: number | null;
  stippage?: number | null;
  closeReason?: string | null;
  status?: "closed";
};

export type TradingProfileData = {
  balance: number;
  openTrades: BackendOpenTrade[];
  closedTrades: BackendClosedTrade[];
};

export type CandleInterval = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

export type BackendCandle = {
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
  type: "buy" | "sell";
  quantity: number;
  leverage: number;
  slippage?: number;
  takeProfit?: number;
  stopLoss?: number;
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

type CandlesResponse = {
  data?: BackendCandle[];
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

async function publicBackendRequest<T>(path: string) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: {
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

async function backendMutation<T>(
  path: string,
  token: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.json().catch(() => null);
    throw new Error(
      responseBody?.message ||
        responseBody?.error ||
        `Backend request failed: ${path}`,
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

export async function closeTrade(orderId: string) {
  const token = await getMobileAccessToken();

  if (!token) {
    throw new Error("No active mobile access token");
  }

  return backendMutation<{ message?: string }>("/api/v1/trade/close", token, {
    orderId,
  });
}

export async function createTrade(payload: CreateTradePayload) {
  const token = await getMobileAccessToken();

  if (!token) {
    throw new Error("No active mobile access token");
  }

  return backendMutation<{ message?: string; orderId?: string }>(
    "/api/v1/trade/create",
    token,
    payload,
  );
}

export async function fetchCandles(
  symbol: string,
  interval: CandleInterval,
): Promise<BackendCandle[]> {
  const response = await publicBackendRequest<CandlesResponse>(
    `/api/v1/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
  );

  return Array.isArray(response.data) ? response.data : [];
}
