import type { Request } from "express";
import { HTTP_HEADERS } from "@repo/config";
import type { AuthenticatedRequest } from "../features/auth/types/auth-request.js";

export default class RequestReader {
  static getBearerToken(req: Request): string | null {
    const authHeader = req.header(HTTP_HEADERS.AUTHORIZATION);
    const token = authHeader?.replace(HTTP_HEADERS.BEARER_PREFIX, "");
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
