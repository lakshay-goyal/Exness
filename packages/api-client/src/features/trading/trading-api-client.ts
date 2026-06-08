import type {
  BalanceResponse,
  BackendClosedTrade,
  BackendOpenTrade,
  Candle,
  CandleInterval,
  CandlesResponse,
  CloseTradeResponse,
  ClosedOrdersResponse,
  CreateTradePayload,
  CreateTradeResponse,
  LatestPrice,
  LatestPricesResponse,
  OpenOrdersResponse,
  TradingProfileData,
} from "@repo/types";
import { parseArray } from "../../shared/parsing/parse-array";

export type AccessTokenProvider = () => string | null | Promise<string | null>;

export type TradingApiClientOptions = {
  baseUrl: string;
  accessToken?: string | AccessTokenProvider;
  fetcher?: typeof fetch;
  headers?: HeadersInit;
};

export class TradingApiClient {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: TradingApiClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async fetchTradingProfileData(): Promise<TradingProfileData> {
    const token = await this.getAccessToken();
    const [balanceResponse, openResponse, closedResponse] = await Promise.all([
      this.authenticatedRequest<BalanceResponse>("/api/v1/balance", token),
      this.authenticatedRequest<OpenOrdersResponse>(
        "/api/v1/trade/open",
        token,
      ),
      this.authenticatedRequest<ClosedOrdersResponse>(
        "/api/v1/trade/close",
        token,
      ),
    ]);

    const balanceValue = Number(balanceResponse.message);

    return {
      balance: Number.isFinite(balanceValue) ? balanceValue : 0,
      openTrades: parseArray<BackendOpenTrade>(openResponse.message),
      closedTrades: parseArray<BackendClosedTrade>(closedResponse.message),
    };
  }

  async createTrade(payload: CreateTradePayload) {
    const token = await this.getAccessToken();
    return this.mutate<CreateTradeResponse>(
      "/api/v1/trade/create",
      token,
      payload,
    );
  }

  async closeTrade(orderId: string) {
    const token = await this.getAccessToken();
    return this.mutate<CloseTradeResponse>("/api/v1/trade/close", token, {
      orderId,
    });
  }

  async fetchCandles(
    symbol: string,
    interval: CandleInterval,
  ): Promise<Candle[]> {
    const response = await this.publicRequest<CandlesResponse>(
      `/api/v1/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
    );

    return Array.isArray(response.data) ? response.data : [];
  }

  async fetchLatestPrices(): Promise<LatestPrice[]> {
    const response = await this.publicRequest<LatestPricesResponse>(
      "/api/v1/prices/latest",
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  private async getAccessToken() {
    const { accessToken } = this.options;
    const token =
      typeof accessToken === "function" ? await accessToken() : accessToken;

    if (!token) {
      throw new Error("No active access token");
    }

    return token;
  }

  private async authenticatedRequest<T>(path: string, token: string) {
    return this.request<T>(path, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private async publicRequest<T>(path: string) {
    return this.request<T>(path);
  }

  private async mutate<T>(
    path: string,
    token: string,
    body: Record<string, unknown>,
  ) {
    return this.request<T>(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}) {
    const response = await this.fetcher(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        ...this.options.headers,
        ...init.headers,
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
}
