import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config, HTTP_HEADERS, TOKEN_TYPES, MESSAGES } from '@repo/config';
import { prisma } from '@repo/db';
import ResponseWriter from '../utils/response-writer.js';
import type { AuthenticatedRequest } from '../features/auth/types/auth-request.js';

const authMiddlewareFunc = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.header(HTTP_HEADERS.AUTHORIZATION);
    const token = authHeader?.replace(HTTP_HEADERS.BEARER_PREFIX, '');

    if (!token) {
      return ResponseWriter.unauthorized(res, MESSAGES.ACCESS_DENIED_NO_TOKEN);
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
      type?: string;
      firstName?: string;
      lastName?: string;
    };

    if (decoded.type === TOKEN_TYPES.REFRESH) {
      return ResponseWriter.unauthorized(res, MESSAGES.INVALID_TOKEN_TYPE);
    }

    const userId = decoded.userId;
    if (!userId) {
      return ResponseWriter.unauthorized(res, MESSAGES.INVALID_TOKEN_NO_USER_ID);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userID: userId }, { email: decoded.email }],
      },
    });

    if (!user) {
      return ResponseWriter.unauthorized(res, MESSAGES.USER_NOT_FOUND);
    }

    req.user = {
      id: user.userID,
      email: user.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    ResponseWriter.unauthorized(res, MESSAGES.INVALID_TOKEN);
  }
};

export const authMiddleware: RequestHandler = (req, res, next) => {
  return authMiddlewareFunc(req as AuthenticatedRequest, res, next);
};
