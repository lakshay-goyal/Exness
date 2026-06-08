import type {
  BackendClosedTrade,
  BackendOpenTrade,
  Candle,
  CandleInterval,
  ClosedOrderResponse,
  CreateTradePayload,
  LatestPrice,
} from './trading';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  hasMobilePin?: boolean;
}

export interface MobileSessionResponse {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    hasMobilePin: boolean;
  };
}

export interface BalanceResponse {
  status?: 'success' | 'error';
  message?: number | string;
}

export interface OpenOrdersResponse {
  message?: string | BackendOpenTrade[];
}

export interface ClosedOrdersResponse {
  message?: BackendClosedTrade[] | string;
}

export interface CandlesResponse {
  data?: Candle[];
}

export interface LatestPricesResponse {
  data?: LatestPrice[];
}

export interface CreateTradeResponse {
  message?: string;
  orderId?: string;
}

export interface CloseTradeResponse {
  message?: string;
  order?: ClosedOrderResponse;
}

export type {
  BackendClosedTrade,
  BackendOpenTrade,
  Candle,
  CandleInterval,
  ClosedOrderResponse,
  CreateTradePayload,
  LatestPrice,
};
