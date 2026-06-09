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
  OpenOrdersResponse,
  TradingProfileData,
} from '@repo/types';
import { parseArray } from '../../shared/parsing/parse-array';

export type AccessTokenProvider = () => string | null | Promise<string | null>;

export interface TradingApiClientOptions {
  baseUrl: string;
  accessToken?: string | AccessTokenProvider;
  fetcher?: typeof fetch;
  headers?: HeadersInit;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export class TradingApiClient {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: TradingApiClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async fetchTradingProfileData(): Promise<TradingProfileData> {
    const token = await this.getAccessToken();
    const [balanceResponse, openResponse, closedResponse] = await Promise.all([
      this.authenticatedRequest<BalanceResponse>('/api/v1/balance', token),
      this.authenticatedRequest<OpenOrdersResponse>('/api/v1/trade/open', token),
      this.authenticatedRequest<ClosedOrdersResponse>('/api/v1/trade/close', token),
    ]);

    const balanceValue = Number(balanceResponse.message);

    return {
      balance: Number.isFinite(balanceValue) ? balanceValue : 0,
      openTrades: parseArray<BackendOpenTrade>(openResponse.message),
      closedTrades: parseArray<BackendClosedTrade>(closedResponse.message),
    };
  }

  async createTrade(payload: CreateTradePayload): Promise<CreateTradeResponse> {
    const token = await this.getAccessToken();
    return this.mutate<CreateTradeResponse>('/api/v1/trade/create', token, payload);
  }

  async closeTrade(orderId: string): Promise<CloseTradeResponse> {
    const token = await this.getAccessToken();
    return this.mutate<CloseTradeResponse>('/api/v1/trade/close', token, {
      orderId,
    });
  }

  async fetchCandles(symbol: string, interval: CandleInterval): Promise<Candle[]> {
    const response = await this.publicRequest<CandlesResponse>(
      `/api/v1/candles?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,
    );

    return Array.isArray(response.data) ? response.data : [];
  }

  private async getAccessToken(): Promise<string> {
    const { accessToken } = this.options;
    const token = typeof accessToken === 'function' ? await accessToken() : accessToken;

    if (token === null || token === undefined || token === '') {
      throw new Error('No active access token');
    }

    return token;
  }

  private async authenticatedRequest<T>(path: string, token: string): Promise<T> {
    return this.request<T>(path, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  }

  private async publicRequest<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  private async mutate<T>(path: string, token: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        contentType: 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headersInit: Record<string, string> = {};
    
    const { headers: optionsHeaders } = this.options;
    if (optionsHeaders !== undefined && typeof optionsHeaders === 'object') {
      if (Symbol.iterator in optionsHeaders) {
        // Headers is iterable
        for (const [key, value] of optionsHeaders as Iterable<[string, string]>) {
          headersInit[key] = value;
        }
      } else {
        // Plain object
        Object.assign(headersInit, optionsHeaders);
      }
    }

    const { headers: initHeaders } = init;
    if (initHeaders !== undefined && typeof initHeaders === 'object') {
      if (Symbol.iterator in initHeaders) {
        for (const [key, value] of initHeaders as Iterable<[string, string]>) {
          headersInit[key] = value;
        }
      } else {
        Object.assign(headersInit, initHeaders);
      }
    }

    const response = await this.fetcher(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: headersInit,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ErrorResponse | null;
      const message = body?.message ?? body?.error ?? `Backend request failed: ${path}`;
      throw new Error(message);
    }

    return (await response.json()) as T;
  }
}
