import { z } from "zod";
import { SymbolSchema, CandleIntervalSchema } from "./common.schemas.js";

/**
 * Candles/market data validation schemas
 * These schemas validate request payloads for candles endpoints
 */

/**
 * Schema for GET /candles
 * Validates query parameters for fetching candle data
 */
export const GetCandlesQuerySchema = z.object({
  symbol: SymbolSchema,
  interval: CandleIntervalSchema,
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().min(1, "Limit must be at least 1").max(1000, "Limit must not exceed 1000").optional()),
  startTime: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().positive("Start time must be a positive timestamp").optional()),
  endTime: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined))
    .pipe(z.number().positive("End time must be a positive timestamp").optional()),
});

/**
 * Schema for GET /candles/diagnostics
 * No query parameters required
 */
export const GetDiagnosticsQuerySchema = z.object({});

/**
 * Schema for POST /candles/refresh
 * Validates request body for refreshing candle aggregates
 */
export const RefreshAggregatesSchema = z.object({
  symbol: SymbolSchema.optional(),
  interval: CandleIntervalSchema.optional(),
  force: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val === "true" || val === "1";
      return false;
    }),
});

// Type exports for use in controllers
export type GetCandlesQueryInput = z.infer<typeof GetCandlesQuerySchema>;
export type GetDiagnosticsQueryInput = z.infer<typeof GetDiagnosticsQuerySchema>;
export type RefreshAggregatesInput = z.infer<typeof RefreshAggregatesSchema>;
