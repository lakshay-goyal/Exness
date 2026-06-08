import type {
  BackendClosedTrade,
  BackendOpenTrade,
  Candle,
  CandleInterval,
  ClosedOrderResponse,
  CreateTradePayload,
  LatestPrice,
} from './trading';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  hasMobilePin?: boolean;
};

export type MobileSessionResponse = {
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
};

export type BalanceResponse = {
  status?: 'success' | 'error';
  message?: number | string;
};

export type OpenOrdersResponse = {
  message?: string | BackendOpenTrade[];
};

export type ClosedOrdersResponse = {
  message?: BackendClosedTrade[] | string;
};

export type CandlesResponse = {
  data?: Candle[];
};

export type LatestPricesResponse = {
  data?: LatestPrice[];
};

export type CreateTradeResponse = {
  message?: string;
  orderId?: string;
};

export type CloseTradeResponse = {
  message?: string;
  order?: ClosedOrderResponse;
};

export type {
  BackendClosedTrade,
  BackendOpenTrade,
  Candle,
  CandleInterval,
  ClosedOrderResponse,
  CreateTradePayload,
  LatestPrice,
};
