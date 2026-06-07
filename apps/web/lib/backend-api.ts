import { TradingApiClient } from "@repo/api-client";

export const backendRequestHeaders = {
  "ngrok-skip-browser-warning": "true",
};

export const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
};

export const createTradingApiClient = (token?: string | null) => {
  return new TradingApiClient({
    baseUrl: getBackendUrl(),
    accessToken: token || undefined,
    headers: backendRequestHeaders,
  });
};
