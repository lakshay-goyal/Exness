import { CreateOrderSchema } from '../../../validation/schemas/trading.schemas.js';
import type { CreateOrderInput } from '../../../validation/schemas/trading.schemas.js';

type ValidatedCreateTradeInput =
  | {
      ok: true;
      value: CreateOrderInput;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Service for validating trade input parameters
 * Now uses Zod schemas for type-safe validation
 * This can be used for additional service-level validation if needed
 */
class TradeInputService {
  /**
   * Validates and transforms create order input
   * Uses Zod schema for validation to ensure type safety
   * Returns a result object pattern for backward compatibility
   */
  validateCreateOrder(body: Record<string, unknown>): ValidatedCreateTradeInput {
    const parseResult = CreateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return {
        ok: false,
        error: firstError?.message || 'Invalid order parameters',
      };
    }

    return {
      ok: true,
      value: parseResult.data,
    };
  }
}

export const tradeInputService = new TradeInputService();
