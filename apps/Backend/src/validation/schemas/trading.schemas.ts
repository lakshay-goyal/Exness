import { z } from "zod";
import {
  SymbolSchema,
  OrderSideSchema,
  PositiveNumberSchema,
  PositiveIntegerSchema,
  OptionalPositiveNumberSchema,
  NonNegativeNumberSchema,
} from "./common.schemas.js";

/**
 * Trading-related validation schemas
 * These schemas validate request payloads for trading endpoints
 */

/**
 * Schema for POST /trade/create
 * Validates order creation request body
 * All fields are strictly typed for trading safety
 */
export const CreateOrderSchema = z.object({
  symbol: SymbolSchema,
  type: OrderSideSchema,
  quantity: PositiveNumberSchema,
  leverage: PositiveIntegerSchema,
  slippage: NonNegativeNumberSchema.optional(),
  takeProfit: OptionalPositiveNumberSchema,
  stopLoss: OptionalPositiveNumberSchema,
});

/**
 * Schema for POST /trade/close
 * Validates order closing request body
 */
export const CloseOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID cannot be empty"),
});

/**
 * Schema for GET /trade/open and GET /trade/close
 * Query parameters for fetching orders (if pagination is needed in future)
 */
export const GetOrdersQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().min(1).max(100).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().min(0).optional()),
});

// Type exports for use in controllers and services
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CloseOrderInput = z.infer<typeof CloseOrderSchema>;
export type GetOrdersQueryInput = z.infer<typeof GetOrdersQuerySchema>;
