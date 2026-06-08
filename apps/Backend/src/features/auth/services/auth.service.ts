import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { nodemailerSender } from '@repo/utils';
import { config } from '@repo/config';
import { prisma } from '@repo/db';
import type { Request } from 'express';

import {
  createLegacyJwt,
  createMobileRefreshToken,
  getMobileAuthUser,
  hashMobilePin,
  isValidPin,
  verifyMobileRefreshToken,
} from './mobile-auth.js';
import { ensureTradingUser } from './trading-user.js';
import { engineUserService } from './engine-user.service.js';

const jwtSecret = config.JWT_SECRET;

class AuthService {
  async getTradingUserForEmail(email: string) {
    const existingTradingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingTradingUser) {
      return existingTradingUser;
    }

    const authUser = await prisma.authUser.findUnique({
      where: { email },
    });

    if (authUser) {
      return ensureTradingUser(authUser.id, authUser.email);
    }

    return null;
  }

  async ensureEngineUser(req: Request, userId: string, userEmail: string) {
    return engineUserService.ensureEngineUser(req, userId, userEmail);
  }

  async getMobileSessionToken(req: Request) {
    const mobileUser = await getMobileAuthUser(req);

    if (!mobileUser) {
      return { ok: false as const, error: 'No active auth session' };
    }

    const token = createLegacyJwt({
      id: mobileUser.tradingUser.userID,
      email: mobileUser.tradingUser.email,
    });
    const refreshToken = createMobileRefreshToken({
      id: mobileUser.tradingUser.userID,
      email: mobileUser.tradingUser.email,
    });

    try {
      await this.ensureEngineUser(req, mobileUser.tradingUser.userID, mobileUser.tradingUser.email);
    } catch (error) {
      console.error('Failed to ensure mobile user in Engine:', error);
    }

    return {
      ok: true as const,
      data: {
        token,
        accessToken: token,
        refreshToken,
        accessTokenExpiresIn: 60 * 60 * 24 * 7,
        refreshTokenExpiresIn: 60 * 60 * 24 * 30,
        user: {
          id: mobileUser.tradingUser.userID,
          email: mobileUser.tradingUser.email,
          name: mobileUser.authUser.name,
          image: mobileUser.authUser.image,
          hasMobilePin: Boolean(mobileUser.authUser.mobilePinHash),
        },
      },
    };
  }

  async refreshMobileToken(req: Request, refreshToken: string) {
    if (!refreshToken) {
      return { ok: false as const, error: 'Refresh token is required' };
    }

    try {
      const refreshUser = verifyMobileRefreshToken(refreshToken);

      if (!refreshUser) {
        return { ok: false as const, error: 'Invalid refresh token' };
      }

      const tradingUser = await prisma.user.findFirst({
        where: {
          OR: [{ userID: refreshUser.id }, { email: refreshUser.email }],
        },
      });

      if (!tradingUser || tradingUser.email !== refreshUser.email) {
        return { ok: false as const, error: 'Invalid refresh token' };
      }

      const authUser = await prisma.authUser.findUnique({
        where: { email: tradingUser.email },
      });

      const accessToken = createLegacyJwt({
        id: tradingUser.userID,
        email: tradingUser.email,
      });

      try {
        await this.ensureEngineUser(req, tradingUser.userID, tradingUser.email);
      } catch (error) {
        console.error('Failed to ensure refreshed mobile user in Engine:', error);
      }

      return {
        ok: true as const,
        data: {
          token: accessToken,
          accessToken,
          refreshToken,
          accessTokenExpiresIn: 60 * 60 * 24 * 7,
          refreshTokenExpiresIn: 60 * 60 * 24 * 30,
          user: {
            id: tradingUser.userID,
            email: tradingUser.email,
            name: authUser?.name || tradingUser.email,
            image: authUser?.image,
            hasMobilePin: Boolean(authUser?.mobilePinHash),
          },
        },
      };
    } catch {
      return { ok: false as const, error: 'Invalid or expired refresh token' };
    }
  }

  async setMobilePin(req: Request, pin: unknown) {
    const mobileUser = await getMobileAuthUser(req);

    if (!mobileUser) {
      return { ok: false as const, error: 'No active auth session' };
    }

    if (!isValidPin(pin)) {
      return { ok: false as const, error: 'PIN must be 4 to 6 digits' };
    }

    await prisma.authUser.update({
      where: { id: mobileUser.authUser.id },
      data: {
        mobilePinHash: hashMobilePin(pin as string),
        mobilePinSetAt: new Date(),
      },
    });

    return {
      ok: true as const,
      data: { success: true, hasMobilePin: true },
    };
  }

  async login(email: string) {
    if (!email) {
      return { ok: false as const, error: 'Email is required' };
    }

    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return { ok: false as const, error: 'Server configuration error' };
    }

    try {
      const existingTradingUser = await this.getTradingUserForEmail(email);
      const userId = existingTradingUser?.userID || uuidv4();
      const token = jwt.sign({ userId, email }, jwtSecret);

      if (process.env.NODE_ENV === 'production') {
        try {
          await nodemailerSender(email, token);
        } catch (emailError: unknown) {
          console.error(
            'Failed to send verification email:',
            emailError instanceof Error ? emailError.message : emailError,
          );
        }
      }

      return {
        ok: true as const,
        data: { message: 'Verification link send', email },
      };
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process login request';
      return { ok: false as const, error: errorMessage };
    }
  }

  async verifyEmailLink(req: Request, token: string) {
    if (!token) {
      return { ok: false as const, error: 'Invalid token ❌' };
    }

    try {
      const verify = jwt.verify(token, jwtSecret);

      if (verify) {
        const userEmail = (verify as jwt.JwtPayload).email;
        const userId = (verify as jwt.JwtPayload).userId;

        try {
          const result = await this.ensureEngineUser(req, userId, userEmail);
          if (result && result.function === 'createUser') {
            if (result.message === userId || result.message === 'user Already Exist') {
              return {
                ok: true as const,
                redirect: `${config.FRONTEND_URL}/dashboard?token=${token}`,
              };
            }

            return { ok: true as const, text: 'User already existed' };
          }
        } catch {
          return { ok: false as const, error: 'Trade not placed', statusCode: 411 };
        }
      }

      return { ok: false as const, error: 'Invalid token ❌' };
    } catch {
      return { ok: false as const, error: 'Token expired or invalid ❌' };
    }
  }

  verifyAccessToken(token: string) {
    if (!token) {
      return { ok: false as const, error: 'No token provided.' };
    }

    try {
      const verify = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

      if (!verify) {
        return { ok: false as const, error: 'Invalid token.' };
      }

      if (verify.type === 'refresh') {
        return { ok: false as const, error: 'Invalid token type.' };
      }

      const userEmail = verify.email;
      const userId = verify.userId;

      if (!userId || !userEmail) {
        return { ok: false as const, error: 'Invalid token payload.' };
      }

      return {
        ok: true as const,
        data: { userId, userEmail },
      };
    } catch {
      return { ok: false as const, error: 'Invalid or expired token.' };
    }
  }

  async verifyUser(req: Request, token: string) {
    const tokenResult = this.verifyAccessToken(token);
    if (!tokenResult.ok) {
      return tokenResult;
    }

    const { userId, userEmail } = tokenResult.data;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ userID: userId }, { email: userEmail }],
      },
    });

    if (!user) {
      user = await this.getTradingUserForEmail(userEmail);
    }

    if (!user) {
      try {
        const result = await this.ensureEngineUser(req, userId, userEmail);

        if (result && result.function === 'createUser') {
          const userAfterCreation = await prisma.user.findFirst({
            where: {
              OR: [{ userID: userId }, { email: userEmail }],
            },
          });

          if (userAfterCreation) {
            return {
              ok: true as const,
              data: {
                success: true,
                exists: true,
                userId: userAfterCreation.userID,
                message: 'User verified and exists in database',
              },
            };
          }
        }
      } catch (e) {
        console.error('Error creating user:', e);
      }

      return {
        ok: false as const,
        error: 'User not found in database and creation is in progress.',
        exists: false,
      };
    }

    return {
      ok: true as const,
      data: {
        success: true,
        exists: true,
        userId: user.userID,
        message: 'User verified and exists in database',
      },
    };
  }

  async ensureUser(req: Request, token: string) {
    const tokenResult = this.verifyAccessToken(token);
    if (!tokenResult.ok) {
      return tokenResult;
    }

    const { userId, userEmail } = tokenResult.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ userID: userId }, { email: userEmail }],
      },
    });
    const canonicalUserId = existingUser?.userID || userId;

    try {
      const result = await this.ensureEngineUser(req, canonicalUserId, userEmail);

      if (result && result.function === 'createUser') {
        return {
          ok: true as const,
          data: {
            success: true,
            message:
              result.message === canonicalUserId || result.message === 'user Already Exist'
                ? 'User ensured in Engine and DBStorage'
                : 'User creation initiated',
            userId: canonicalUserId,
          },
        };
      }

      return {
        ok: true as const,
        data: {
          success: true,
          message: 'User creation initiated',
          userId: canonicalUserId,
        },
      };
    } catch (e) {
      console.error('Error ensuring user:', e);
      return {
        ok: false as const,
        error: 'Failed to ensure user, but request was sent to Engine',
      };
    }
  }
}

export const authService = new AuthService();
