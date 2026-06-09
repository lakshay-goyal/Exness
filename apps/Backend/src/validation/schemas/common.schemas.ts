import { z } from 'zod';
import { ERROR_MESSAGES, VALIDATION, CANDLE_INTERVALS, ORDER_SIDES, DEFAULTS } from '@repo/config';

/**
 * Common validation schemas used across multiple endpoints
 * These provide consistent validation for frequently used data types
 */

/**
 * Email validation schema with proper format checking
 */
export const EmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email(ERROR_MESSAGES.INVALID_EMAIL)
  .max(254, 'Email must not exceed 254 characters');

/**
 * UUID validation schema
 */
export const UUIDSchema = z.string().uuid(ERROR_MESSAGES.INVALID_ID_FORMAT);

/**
 * Token validation schema
 */
export const TokenSchema = z.string().min(1, ERROR_MESSAGES.TOKEN_EMPTY);

/**
 * PIN validation schema (4-6 digits)
 */
export const PINSchema = z
  .string()
  .regex(
    new RegExp(`^\\d{${VALIDATION.PIN_MIN_LENGTH},${VALIDATION.PIN_MAX_LENGTH}}$`),
    ERROR_MESSAGES.PIN_LENGTH,
  );

/**
 * Positive number validation schema
 */
export const PositiveNumberSchema = z.number().positive(ERROR_MESSAGES.POSITIVE_NUMBER);

/**
 * Positive integer validation schema
 */
export const PositiveIntegerSchema = z
  .number()
  .int(ERROR_MESSAGES.POSITIVE_INTEGER)
  .positive(ERROR_MESSAGES.POSITIVE_NUMBER);

/**
 * Non-negative number validation schema (zero or positive)
 */
export const NonNegativeNumberSchema = z
  .number()
  .min(VALIDATION.MIN_ORDER_AMOUNT, ERROR_MESSAGES.NON_NEGATIVE_NUMBER);

/**
 * Optional positive number validation schema
 */
export const OptionalPositiveNumberSchema = z
  .number()
  .positive(ERROR_MESSAGES.POSITIVE_NUMBER)
  .optional();

/**
 * Symbol/trading pair validation schema
 */
export const SymbolSchema = z
  .string()
  .min(1, 'Symbol cannot be empty')
  .max(30, 'Symbol must not exceed 30 characters')
  .regex(/^[A-Z0-9_]+(\/[A-Z0-9_]+)?$/, ERROR_MESSAGES.INVALID_SYMBOL_FORMAT);

/**
 * Trading order side validation schema
 */
export const OrderSideSchema = z.enum(ORDER_SIDES, {
  error: ERROR_MESSAGES.ORDER_SIDE_INVALID,
});

/**
 * Candle interval validation schema
 */
export const CandleIntervalSchema = z.enum(CANDLE_INTERVALS, {
  error: ERROR_MESSAGES.INVALID_CANDLE_INTERVAL,
});

/**
 * Pagination parameters schema
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : DEFAULTS.PAGINATION_PAGE))
    .pipe(z.number().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : DEFAULTS.PAGINATION_LIMIT))
    .pipe(
      z
        .number()
        .min(1, 'Limit must be at least 1')
        .max(
          DEFAULTS.MAX_PAGINATION_LIMIT,
          `Limit must not exceed ${DEFAULTS.MAX_PAGINATION_LIMIT}`,
        ),
    ),
});

/**
 * Coerce string to number helper for query params
 */
export const CoercedPositiveNumber = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().positive(ERROR_MESSAGES.POSITIVE_NUMBER));

/**
 * Coerce string to integer helper for query params
 */
export const CoercedPositiveInteger = z
  .string()
  .transform((val) => Number(val))
  .pipe(z.number().int(ERROR_MESSAGES.POSITIVE_INTEGER).positive(ERROR_MESSAGES.POSITIVE_NUMBER));
