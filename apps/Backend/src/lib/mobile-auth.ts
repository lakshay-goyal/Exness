import { createHmac, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { config } from "@repo/config";
import { prisma } from "@repo/db";

import { auth } from "./better-auth.js";
import { ensureTradingUser } from "./trading-user.js";

export async function getMobileAuthUser(req: Request) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  const authUser = await prisma.authUser.findUnique({
    where: { id: session.user.id },
  });

  if (!authUser) {
    return null;
  }

  await ensureTradingUser(session.user.id, session.user.email);

  return {
    authUser,
    sessionUser: session.user,
  };
}

export function createLegacyJwt(user: { id: string; email: string }) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: "access",
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

export function createMobileRefreshToken(user: { id: string; email: string }) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: "refresh",
    },
    config.JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );
}

export function verifyMobileRefreshToken(token: string) {
  const payload = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;

  if (
    payload.type !== "refresh" ||
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string"
  ) {
    return null;
  }

  return {
    id: payload.userId,
    email: payload.email,
  };
}

export function hashMobilePin(pin: string) {
  return createHmac("sha256", config.JWT_SECRET)
    .update(`mobile-pin:${pin}`)
    .digest("hex");
}

export function isValidPin(pin: unknown) {
  return typeof pin === "string" && /^\d{4,6}$/.test(pin);
}

export function verifyPin(pin: string, pinHash: string) {
  const expected = Buffer.from(hashMobilePin(pin), "hex");
  const actual = Buffer.from(pinHash, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
