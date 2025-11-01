import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@repo/config';
import { prisma } from '@repo/db';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Auth middleware - Request headers:', req.headers);
    const authHeader = req.header('Authorization');
    console.log('Auth middleware - Authorization header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Auth middleware - Extracted token:', token);
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };

    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token: userId not found.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { userID: userId },
          { email: decoded.email }
        ]
      }
    });

    if (!user) {
      console.log('Auth middleware - User not found in database:', { userId, email: decoded.email });
      return res.status(401).json({ error: 'User not found in database. Please login again.' });
    }

    req.user = {
      id: userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};
