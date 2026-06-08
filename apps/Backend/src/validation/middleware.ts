import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType, type ZodIssue } from "zod";
import ResponseWriter from "../utils/response-writer.js";

type ValidationSource = "body" | "query" | "params" | "headers";

const formatPath = (issue: ZodIssue): string => {
  const field = issue.path
    .filter((segment) => typeof segment === "string" || typeof segment === "number")
    .map(String)
    .join(".");

  return field || "this field";
};

const formatValidationMessage = (issue: ZodIssue): string => {
  const path = formatPath(issue);

  // Use the issue message directly, which is already formatted by Zod
  // but enhance it with the field name if needed
  const message = issue.message;

  // If message doesn't already include the path, prepend it for clarity
  if (!message.includes(path) && path !== "this field") {
    return `${path}: ${message}`;
  }

  return message;
};

const assignValidatedRequestData = (
  req: Request,
  source: ValidationSource,
  parsedData: unknown,
): void => {
  switch (source) {
    case "body":
      req.body = parsedData;
      break;
    case "query":
      Object.defineProperty(req, "query", {
        value: parsedData,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      break;
    case "params":
      req.params = parsedData as Request["params"];
      break;
    case "headers":
      // Headers are not replaced, just validated
      break;
  }
};

const getDataToValidate = (req: Request, source: ValidationSource): unknown => {
  switch (source) {
    case "body":
      return req.body;
    case "query":
      return req.query;
    case "params":
      return req.params;
    case "headers":
      return req.headers;
    default:
      return undefined;
  }
};

/**
 * Creates a validation middleware for Express routes
 * @param schema - Zod schema to validate against
 * @param source - Where to get the data from: 'body', 'query', 'params', or 'headers'
 * @returns Express middleware function
 */
export const validateRequest = (schema: ZodType, source: ValidationSource = "body") => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate = getDataToValidate(req, source);
      const parsedData = await schema.parseAsync(dataToValidate);
      assignValidatedRequestData(req, source, parsedData);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const message = firstIssue
          ? formatValidationMessage(firstIssue)
          : "Please check the information you entered and try again.";

        ResponseWriter.badRequest(res, message);
        return;
      }
      next(error);
    }
  };
};

/**
 * Shorthand for validating request body
 */
export const validateBody = (schema: ZodType) => validateRequest(schema, "body");

/**
 * Shorthand for validating query parameters
 */
export const validateQuery = (schema: ZodType) => validateRequest(schema, "query");

/**
 * Shorthand for validating URL parameters
 */
export const validateParams = (schema: ZodType) => validateRequest(schema, "params");
