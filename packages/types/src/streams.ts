import type { ClosedOrder, CloseReason } from './trading';

export const streamFunctions = [
  'createUser',
  'createOrder',
  'createCloseOrder',
  'getOpenOrder',
  'getCloseOrders',
] as const;

export type StreamFunctionName = (typeof streamFunctions)[number];

export interface CorrelatedStreamMessage {
  requestId?: string;
  correlationId?: string;
}

export interface CreateUserCommand extends CorrelatedStreamMessage {
  function: 'createUser';
  userId: string;
  userEmail: string;
}

export interface CreateOrderCommand extends CorrelatedStreamMessage {
  function: 'createOrder';
  userId: string;
  symbol: string;
  type: string;
  quantity: number | string;
  leverage: number | string;
  bid: number | string;
  ask: number | string;
  slippage?: number | string;
  takeProfit?: number | string;
  stopLoss?: number | string;
}

export interface CloseOrderCommand extends CorrelatedStreamMessage {
  function: 'createCloseOrder';
  orderId: string;
  userId: string;
  closeReason?: CloseReason;
}

export interface GetUserOrdersCommand extends CorrelatedStreamMessage {
  function: 'getOpenOrder' | 'getCloseOrders';
  userId: string;
}

export type EngineCommand =
  | CreateUserCommand
  | CreateOrderCommand
  | CloseOrderCommand
  | GetUserOrdersCommand;

export type DbStorageCommand =
  | (CorrelatedStreamMessage & {
      function: 'createCloseOrder';
      message: ClosedOrder;
    })
  | GetUserOrdersCommand
  | CreateUserCommand
  | (CorrelatedStreamMessage & {
      function: string;
      message?: unknown;
      userId?: string;
    });

export interface StreamResponse extends CorrelatedStreamMessage {
  function: string;
  message?: unknown;
}
