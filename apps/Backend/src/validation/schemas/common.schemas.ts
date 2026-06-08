import { z } from "zod";

/**
 * Common validation schemas used across multiple endpoints
 * These provide consistent validation for frequently used data types
 */

/**
 * Email validation schema with proper format checking
 */
export const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please provide a valid email address")
  .max(254, "Email must not exceed 254 characters");

/**
 * UUID validation schema
 */
export const UUIDSchema = z.string().uuid("Invalid ID format");

/**
 * Token validation schema
 */
export const TokenSchema = z.string().min(1, "Token cannot be empty");

/**
 * PIN validation schema (4-6 digits)
 */
export const PINSchema = z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits");

/**
 * Positive number validation schema
 */
export const PositiveNumberSchema = z
  .number()
  .positive("Value must be greater than 0");

/**
 * Positive integer validation schema
 */
export const PositiveIntegerSchema = z
  .number()
  .int("Value must be a whole number")
  .positive("Value must be greater than 0");

/**
 * Non-negative number validation schema (zero or positive)
 */
export const NonNegativeNumberSchema = z.number().min(0, "Value must be zero or greater");

/**
 * Optional positive number validation schema
 */
export const OptionalPositiveNumberSchema = z
  .number()
  .positive("Value must be greater than 0")
  .optional();

/**
 * Symbol/trading pair validation schema
 */
export const SymbolSchema = z
  .string()
  .min(1, "Symbol cannot be empty")
  .max(20, "Symbol must not exceed 20 characters")
  .regex(
    /^[A-Z0-9]+(\/[A-Z0-9]+)?$/,
    "Symbol must be a valid trading pair (e.g., BTC/USD or BTCUSD)",
  );

/**
 * Trading order side validation schema
 */
export const OrderSideSchema = z.enum(["buy", "sell"], {
  error: "Order type must be either 'buy' or 'sell'",
});

/**
 * Candle interval validation schema
 */
export const CandleIntervalSchema = z.enum(
  ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"],
  {
    error: "Interval must be one of: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M",
  },
);

/**
 * Pagination parameters schema
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1))
    .pipe(z.number().min(1, "Page must be at least 1")),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 20))
    .pipe(z.number().min(1, "Limit must be at least 1").max(100, "Limit must not exceed 100")),
});

/**
 * Coerce string to number helper for query params
 */
export const CoercedPositiveNumber = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().positive("Value must be greater than 0"));

/**
 * Coerce string to integer helper for query params
 */
export const CoercedPositiveInteger = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().int("Value must be a whole number").positive("Value must be greater than 0"));
