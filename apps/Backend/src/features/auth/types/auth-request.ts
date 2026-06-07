import type { Request } from "express";

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
};
