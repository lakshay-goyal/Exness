import express from "express";
import { authController } from "../features/auth/controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.get("/mobile/session-token", (req, res) =>
  authController.getMobileSessionToken(req, res),
);

authRouter.post("/mobile/refresh-token", (req, res) =>
  authController.refreshMobileToken(req, res),
);

authRouter.post("/mobile/pin", (req, res) =>
  authController.setMobilePin(req, res),
);

authRouter.post("/login", (req, res) => authController.login(req, res));

authRouter.get("/verify", (req, res) => authController.verifyEmailLink(req, res));

authRouter.post("/verify-user", (req, res) =>
  authController.verifyUser(req, res),
);

authRouter.post("/ensure-user", (req, res) =>
  authController.ensureUser(req, res),
);

export default authRouter;
