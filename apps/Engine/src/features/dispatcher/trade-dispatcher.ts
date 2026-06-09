import type { EngineCommand } from '@repo/types';
import { createUserFunction } from '../users/create-user.handler.js';
import { createOrderFunction } from '../orders/create-order.handler.js';
import { getOpenOrderFunction } from '../orders/get-open-orders.handler.js';
import { getCloseOrdersFunction } from '../orders/get-closed-orders.handler.js';
import { createCloseOrderFunction } from '../orders/close-order.handler.js';

export async function tradeFunction(result: EngineCommand) {
  if (result.function === 'createCloseOrder') {
    await createCloseOrderFunction(result);
  }
  if (result.function === 'createUser') {
    await createUserFunction(result);
  }
  if (result.function === 'createOrder') {
    await createOrderFunction(result);
  }
  if (result.function === 'getOpenOrder') {
    await getOpenOrderFunction(result);
  }
  if (result.function === 'getCloseOrders') {
    await getCloseOrdersFunction(result);
  }
}
