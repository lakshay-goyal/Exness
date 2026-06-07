import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@repo/config";
import { prisma } from "@repo/db";
import type { AuthenticatedRequest } from "../features/auth/types/auth-request.js";

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.header("Authorization");

    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
      type?: string;
      firstName?: string;
      lastName?: string;
    };

    if (decoded.type === "refresh") {
      return res.status(401).json({ error: "Invalid token type." });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Invalid token: userId not found." });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ userID: userId }, { email: decoded.email }],
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: "User not found in database. Please login again." });
    }

    req.user = {
      id: user.userID,
      email: user.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token." });
  }
};
