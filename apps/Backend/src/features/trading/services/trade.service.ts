import type { Request } from 'express';
import { getEngineStreamClient } from '../../../infrastructure/redis/engine-stream.service.js';
import { parseStreamMessage } from '../../../shared/streams/stream-message.js';
import { tradeInputService } from './trade-input.service.js';

function timeoutAfter(ms: number, message: string) {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

class TradeService {
  async createOrder(req: Request, userId: string, body: Record<string, unknown>) {
    const validatedInput = tradeInputService.validateCreateOrder(body);

    if (!validatedInput.ok) {
      return { ok: false as const, error: validatedInput.error };
    }

    const orderPayload = {
      function: 'createOrder',
      userId,
      ...validatedInput.value,
    };

    try {
      const engineStreamClient = getEngineStreamClient(req);
      const requestId = await engineStreamClient.sendToEngine(orderPayload);
      const result = (await Promise.race([
        engineStreamClient.readEngineResponse(requestId, 5000),
        timeoutAfter(3000, 'Order creation request timed out after 3 seconds'),
      ])) as { function?: string; message?: unknown } | null;

      if (!result) {
        return {
          ok: false as const,
          error: 'Request timeout: No response received within 3 seconds',
          message: 'Order creation request timed out. The order may have been cancelled.',
          timeout: true,
        };
      }

      if (result.function !== 'createOrder') {
        return {
          ok: false as const,
          error: 'Unexpected response from Engine',
          message: 'Failed to create order',
        };
      }

      const orderResult = parseStreamMessage<Record<string, unknown>>(result.message, {});

      if (orderResult.error || !orderResult.success) {
        return {
          ok: false as const,
          error: String(orderResult.error || 'Failed to create order'),
          message: String(orderResult.error || 'Failed to create order'),
        };
      }

      return {
        ok: true as const,
        data: {
          message: String(orderResult.message || 'Order created successfully'),
          orderId: orderResult.orderId,
        },
      };
    } catch (error) {
      console.error('Error in create order:', error);

      if (error instanceof Error && error.message.includes('timed out')) {
        return {
          ok: false as const,
          error: 'Request timeout: Order creation took longer than 3 seconds',
          message: 'Order creation request timed out. The order may have been cancelled.',
          timeout: true,
        };
      }

      return {
        ok: false as const,
        error: 'Failed to read response from Engine',
        message: 'Failed to create order',
      };
    }
  }

  async getOpenOrders(req: Request, userId: string) {
    try {
      const { response } = await getEngineStreamClient(req).request({
        function: 'getOpenOrder',
        userId,
      });

      if (response?.function === 'getOpenOrder') {
        return { ok: true as const, data: { message: response.message } };
      }

      console.warn('Unexpected response structure for open orders:', response);
      return { ok: true as const, data: { message: JSON.stringify([]) } };
    } catch (error) {
      console.error('Error reading from secondary Redis stream for open orders:', error);
      return {
        ok: false as const,
        error: 'Failed to fetch open orders',
        message: JSON.stringify([]),
      };
    }
  }

  async closeOrder(req: Request, userId: string, orderId: string) {
    if (!orderId) {
      return {
        ok: false as const,
        error: 'Missing required parameters: orderId',
      };
    }

    try {
      const { response } = await getEngineStreamClient(req).request({
        function: 'createCloseOrder',
        orderId,
        userId,
      });

      if (response?.function !== 'createCloseOrder') {
        return { ok: false as const, error: 'Failed to close order' };
      }

      const orderData = parseStreamMessage<Record<string, unknown>>(response.message, {});

      if (orderData.error) {
        return {
          ok: false as const,
          error: String(orderData.error),
          message: String(orderData.error),
        };
      }

      if (orderData.orderId !== orderId) {
        console.warn('Warning: Order ID mismatch during close order.');
        return { ok: false as const, error: 'Order ID mismatch' };
      }

      return {
        ok: true as const,
        data: {
          message: 'Order closed successfully',
          order: orderData,
        },
      };
    } catch (error) {
      console.error('Error in close order:', error);
      return {
        ok: false as const,
        error: 'Failed to close order',
        message: 'Internal server error',
      };
    }
  }

  async getCloseOrders(req: Request, userId: string) {
    try {
      const { response } = await getEngineStreamClient(req).request({
        function: 'getCloseOrders',
        userId,
      });

      if (response?.function !== 'getCloseOrders') {
        return { ok: true as const, data: { message: [] } };
      }

      const closeOrders = parseStreamMessage<unknown[]>(response.message, []);
      return {
        ok: true as const,
        data: {
          message: Array.isArray(closeOrders) ? closeOrders : [],
        },
      };
    } catch (error) {
      console.error('Error reading from secondary Redis stream for close orders:', error);
      return {
        ok: false as const,
        error: 'Failed to fetch close orders',
        message: [],
      };
    }
  }
}

export const tradeService = new TradeService();
