import { z } from "zod";
import { EmailSchema, TokenSchema, PINSchema } from "./common.schemas.js";

/**
 * Authentication-related validation schemas
 * These schemas validate request payloads for auth endpoints
 */

/**
 * Schema for POST /auth/mobile/refresh-token
 * Validates refresh token in request body
 */
export const RefreshMobileTokenSchema = z.object({
  refreshToken: TokenSchema,
});

/**
 * Schema for POST /auth/mobile/pin
 * Validates PIN setup for mobile authentication
 */
export const SetMobilePinSchema = z.object({
  pin: PINSchema,
});

/**
 * Schema for POST /auth/login
 * Validates login request with email
 */
export const LoginSchema = z.object({
  email: EmailSchema,
});

/**
 * Schema for GET /auth/verify
 * Validates email verification link query parameters
 */
export const VerifyEmailLinkSchema = z.object({
  token: TokenSchema,
});

/**
 * Schema for POST /auth/verify-user
 * Validates user verification request
 */
export const VerifyUserSchema = z.object({});

/**
 * Schema for POST /auth/ensure-user
 * Validates user creation/ensurance request
 */
export const EnsureUserSchema = z.object({});

// Type exports for use in controllers
export type RefreshMobileTokenInput = z.infer<typeof RefreshMobileTokenSchema>;
export type SetMobilePinInput = z.infer<typeof SetMobilePinSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyEmailLinkInput = z.infer<typeof VerifyEmailLinkSchema>;
