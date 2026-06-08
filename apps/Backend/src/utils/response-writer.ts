import type { Response } from "express";
import { HTTP_STATUS, MESSAGES } from "@repo/config";

export default class ResponseWriter {
  static success<T>(
    res: Response,
    data: T,
    message: string = MESSAGES.SUCCESS,
  ): Response {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
      message,
    });
  }

  static error(
    res: Response,
    statusCode: number,
    message: string = MESSAGES.ERROR,
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
    });
  }

  static unauthorized(
    res: Response,
    message: string = MESSAGES.UNAUTHORIZED,
  ): Response {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message,
    });
  }

  static forbidden(res: Response, message: string = MESSAGES.FORBIDDEN): Response {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      statusCode: HTTP_STATUS.FORBIDDEN,
      message,
    });
  }

  static notFound(res: Response, message: string = MESSAGES.NOT_FOUND): Response {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      statusCode: HTTP_STATUS.NOT_FOUND,
      message,
    });
  }

  static badRequest(res: Response, message: string = MESSAGES.BAD_REQUEST): Response {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message,
    });
  }

  static internalServerError(
    res: Response,
    message: string = MESSAGES.INTERNAL_SERVER_ERROR,
  ): Response {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
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
