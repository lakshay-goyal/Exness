import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import ResponseWriter from '../utils/response-writer.js';

/**
 * Custom API Error class for structured error handling
 * Extends the native Error class with HTTP status codes and additional metadata
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Creates a 400 Bad Request error
   */
  static badRequest(message: string = 'Bad Request', errorCode?: string): ApiError {
    return new ApiError(message, 400, errorCode);
  }

  /**
   * Creates a 401 Unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized', errorCode?: string): ApiError {
    return new ApiError(message, 401, errorCode);
  }

  /**
   * Creates a 403 Forbidden error
   */
  static forbidden(message: string = 'Forbidden', errorCode?: string): ApiError {
    return new ApiError(message, 403, errorCode);
  }

  /**
   * Creates a 404 Not Found error
   */
  static notFound(message: string = 'Not Found', errorCode?: string): ApiError {
    return new ApiError(message, 404, errorCode);
  }

  /**
   * Creates a 408 Request Timeout error
   */
  static timeout(message: string = 'Request Timeout', errorCode?: string): ApiError {
    return new ApiError(message, 408, errorCode);
  }

  /**
   * Creates a 409 Conflict error
   */
  static conflict(message: string = 'Conflict', errorCode?: string): ApiError {
    return new ApiError(message, 409, errorCode);
  }

  /**
   * Creates a 422 Unprocessable Entity error
   */
  static unprocessable(message: string = 'Unprocessable Entity', errorCode?: string): ApiError {
    return new ApiError(message, 422, errorCode);
  }

  /**
   * Creates a 500 Internal Server Error
   */
  static internal(message: string = 'Internal Server Error', errorCode?: string): ApiError {
    return new ApiError(message, 500, errorCode, false);
  }
}

/**
 * Async handler wrapper - eliminates need for try-catch in controllers
 * Wraps async route handlers to catch errors and pass them to next()
 */
export const asyncHandler = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 * This should be registered last in your Express app
 */
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Handle known operational errors
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      console.error('Operational error:', err);
    }

    ResponseWriter.error(res, err.statusCode, err.message);
    return;
  }

  // Handle Zod validation errors (should be caught by validation middleware, but just in case)
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const message = firstIssue ? firstIssue.message : 'Validation failed';
    ResponseWriter.badRequest(res, message);
    return;
  }

  // Handle Prisma errors by checking for Prisma-specific properties
  const errorWithCode = err as Error & { code?: string };
  if (errorWithCode.code && errorWithCode.code.startsWith('P')) {
    console.error('Prisma error:', err);

    // Handle specific Prisma error codes
    switch (errorWithCode.code) {
      case 'P2002': // Unique constraint violation
        ResponseWriter.error(res, 409, 'Resource already exists');
        return;
      case 'P2025': // Record not found
        ResponseWriter.notFound(res, 'Resource not found');
        return;
      case 'P2003': // Foreign key constraint failed
        ResponseWriter.badRequest(res, 'Invalid reference to related resource');
        return;
      default:
        ResponseWriter.internalServerError(res, 'Database error occurred');
        return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    ResponseWriter.unauthorized(res, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ResponseWriter.unauthorized(res, 'Token expired');
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    ResponseWriter.badRequest(res, 'Invalid JSON in request body');
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  // Return generic error for non-operational errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : 'Something went wrong';

  ResponseWriter.internalServerError(res, message);
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseWriter.notFound(res, `Route ${req.method} ${req.path} not found`);
};
