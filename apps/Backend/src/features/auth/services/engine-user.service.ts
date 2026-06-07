import type { Request } from "express";
import { getEngineStreamClient } from "../../../infrastructure/redis/engine-stream.service.js";

export class EngineUserService {
  async ensureEngineUser(req: Request, userId: string, userEmail: string) {
    const { response } = await getEngineStreamClient(req).request({
      function: "createUser",
      userId,
      userEmail,
    });

    return response;
  }
}

export const engineUserService = new EngineUserService();
