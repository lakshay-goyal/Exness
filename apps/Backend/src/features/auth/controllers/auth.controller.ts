import type { Request, Response } from "express";
import ResponseWriter from "../../../utils/response-writer.js";
import RequestReader from "../../../utils/request-reader.js";
import { authService } from "../services/auth.service.js";

class AuthController {
  async getMobileSessionToken(req: Request, res: Response) {
    const result = await authService.getMobileSessionToken(req);

    if (!result.ok) {
      return ResponseWriter.unauthorized(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async refreshMobileToken(req: Request, res: Response) {
    const refreshToken = RequestReader.getBodyField<string>(req, "refreshToken");

    if (typeof refreshToken !== "string" || !refreshToken) {
      return ResponseWriter.badRequest(res, "Refresh token is required");
    }

    const result = await authService.refreshMobileToken(req, refreshToken);

    if (!result.ok) {
      return ResponseWriter.unauthorized(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async setMobilePin(req: Request, res: Response) {
    const pin = RequestReader.getBodyField(req, "pin");
    const result = await authService.setMobilePin(req, pin);

    if (!result.ok) {
      if (result.error === "No active auth session") {
        return ResponseWriter.unauthorized(res, result.error);
      }
      return ResponseWriter.badRequest(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async login(req: Request, res: Response) {
    const email = RequestReader.getBodyField<string>(req, "email");
    const result = await authService.login(email ?? "");

    if (!result.ok) {
      if (result.error === "Email is required") {
        return ResponseWriter.badRequest(res, result.error);
      }
      if (result.error === "Server configuration error") {
        return ResponseWriter.internalServerError(res, result.error);
      }
      return ResponseWriter.internalServerError(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async verifyEmailLink(req: Request, res: Response) {
    const token = RequestReader.getQueryParam(req, "token") ?? "";
    const result = await authService.verifyEmailLink(req, token);

    if (result.ok) {
      if ("redirect" in result && result.redirect) {
        return ResponseWriter.redirect(res, result.redirect);
      }
      if ("text" in result && result.text) {
        return ResponseWriter.text(res, 200, result.text);
      }
    }

    if (!result.ok) {
      if ("statusCode" in result && result.statusCode === 411) {
        return ResponseWriter.error(res, 411, result.error);
      }
      return ResponseWriter.text(res, 401, result.error);
    }

    return ResponseWriter.text(res, 401, "Invalid token ❌");
  }

  async verifyUser(req: Request, res: Response) {
    const token = RequestReader.getBearerToken(req);

    if (!token) {
      return ResponseWriter.unauthorized(res, "No token provided.");
    }

    const result = await authService.verifyUser(req, token);

    if (!result.ok) {
      if ("exists" in result && result.exists === false) {
        return ResponseWriter.notFound(res, result.error);
      }
      if (
        result.error === "Invalid token payload." ||
        result.error === "Invalid token type."
      ) {
        return ResponseWriter.badRequest(res, result.error);
      }
      return ResponseWriter.unauthorized(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }

  async ensureUser(req: Request, res: Response) {
    const token = RequestReader.getBearerToken(req);

    if (!token) {
      return ResponseWriter.unauthorized(res, "No token provided.");
    }

    const result = await authService.ensureUser(req, token);

    if (!result.ok) {
      if (result.error === "Invalid token payload.") {
        return ResponseWriter.badRequest(res, result.error);
      }
      if (result.error === "Failed to ensure user, but request was sent to Engine") {
        return ResponseWriter.internalServerError(res, result.error);
      }
      return ResponseWriter.unauthorized(res, result.error);
    }

    return ResponseWriter.success(res, result.data);
  }
}

export const authController = new AuthController();
