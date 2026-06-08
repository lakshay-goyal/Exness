import type { Request } from "express";
import type { AuthenticatedRequest } from "../features/auth/types/auth-request.js";

export default class RequestReader {
  static getBearerToken(req: Request): string | null {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    return token || null;
  }

  static getBodyField<T>(req: Request, field: string): T | undefined {
    return req.body?.[field];
  }

  static getQueryParam(req: Request, param: string): string | undefined {
    const value = req.query[param];
    return typeof value === "string" ? value : undefined;
  }

  static getAuthenticatedUser(req: Request) {
    return (req as AuthenticatedRequest).user;
  }
}
