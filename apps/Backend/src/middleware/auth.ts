import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@repo/config';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
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

    // Extract userId from the decoded JWT token
    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token: userId not found.' });
    }

    req.user = {
      id: userId,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};
