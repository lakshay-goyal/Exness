import type { Response } from "express";

export default class ResponseWriter {
  static success<T>(
    res: Response,
    data: T,
    message: string = "Success",
  ): Response {
    return res.status(200).json({
      success: true,
      data,
      message,
    });
  }

  static error(
    res: Response,
    statusCode: number,
    message: string = "Error",
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }

  static unauthorized(
    res: Response,
    message: string = "Unauthorized",
  ): Response {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message,
    });
  }

  static forbidden(res: Response, message: string = "Forbidden"): Response {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message,
    });
  }

  static notFound(res: Response, message: string = "Not Found"): Response {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message,
    });
  }

  static badRequest(res: Response, message: string = "Bad Request"): Response {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message,
    });
  }

  static internalServerError(
    res: Response,
    message: string = "Internal Server Error",
  ): Response {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message,
    });
  }

  static redirect(res: Response, url: string): void {
    res.redirect(url);
  }

  static text(res: Response, statusCode: number, message: string): Response {
    return res.status(statusCode).send(message);
  }
}
