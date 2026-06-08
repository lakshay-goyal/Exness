import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import { config } from "@repo/config";
import { prisma } from "@repo/db";

const balanceRouter = express.Router();
const jwtSecret = config.JWT_SECRET;

balanceRouter.get(
  "/",
  authMiddleware as any,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as Request & { user?: { id: string } };
      const userId = authReq.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        // Fetch balance directly from database
        const user = await prisma.user.findUnique({
          where: { userID: userId },
        });

        if (!user) {
          return res.status(404).json({
            status: "error",
            message: "User not found",
          });
        }

        // Get balance from user object (balance field should be available after Prisma client regeneration)
        const balance = (user as any).balance ?? 0;

        return res.json({
          status: "success",
          message: balance,
        });
      } catch (e: any) {
        console.error("Error fetching balance from database:", e);
        return res.status(500).json({
          status: "error",
          message: "Failed to fetch balance from database",
        });
      }
    } catch (err: any) {
      console.error("Error in balance route:", err);
      if (err.message && err.message.includes("Token")) {
        return res.status(401).json({ error: "Token expired or invalid ❌" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default balanceRouter;
