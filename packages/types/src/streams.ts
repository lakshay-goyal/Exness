import type { ClosedOrder, CloseReason, OrderSide } from "./trading";

export const streamFunctions = [
  "createUser",
  "createOrder",
  "createCloseOrder",
  "getOpenOrder",
  "getCloseOrders",
  "pricePoller",
] as const;

export type StreamFunctionName = (typeof streamFunctions)[number];

export type CorrelatedStreamMessage = {
  requestId?: string;
  correlationId?: string;
};

export type CreateUserCommand = CorrelatedStreamMessage & {
  function: "createUser";
  userId: string;
  userEmail: string;
};

export type CreateOrderCommand = CorrelatedStreamMessage & {
  function: "createOrder";
  userId: string;
  symbol: string;
  type: OrderSide | string;
  quantity: number | string;
  leverage: number | string;
  slippage?: number | string;
  takeProfit?: number | string;
  stopLoss?: number | string;
};

export type CloseOrderCommand = CorrelatedStreamMessage & {
  function: "createCloseOrder";
  orderId: string;
  userId: string;
  closeReason?: CloseReason;
};

export type GetUserOrdersCommand = CorrelatedStreamMessage & {
  function: "getOpenOrder" | "getCloseOrders";
  userId: string;
};

export type PricePollerCommand = CorrelatedStreamMessage & {
  function: "pricePoller";
  message: string;
};

export type EngineCommand =
  | CreateUserCommand
  | CreateOrderCommand
  | CloseOrderCommand
  | GetUserOrdersCommand
  | PricePollerCommand;

export type DbStorageCommand =
  | (CorrelatedStreamMessage & {
      function: "createCloseOrder";
      message: ClosedOrder;
    })
  | GetUserOrdersCommand
  | CreateUserCommand
  | (CorrelatedStreamMessage & {
      function: string;
      message?: unknown;
      userId?: string;
    });

export type StreamResponse = CorrelatedStreamMessage & {
  function: StreamFunctionName | string;
  message?: unknown;
};
