import express from 'express';
import { authController } from '../features/auth/controllers/auth.controller.js';
import { validateBody, validateQuery } from '../validation/middleware.js';
import {
  RefreshMobileTokenSchema,
  SetMobilePinSchema,
  LoginSchema,
  VerifyEmailLinkSchema,
} from '../validation/schemas/auth.schemas.js';

const authRouter = express.Router();

authRouter.get('/mobile/session-token', authController.getMobileSessionToken);

authRouter.post(
  '/mobile/refresh-token',
  validateBody(RefreshMobileTokenSchema),
  authController.refreshMobileToken,
);

authRouter.post('/mobile/pin', validateBody(SetMobilePinSchema), authController.setMobilePin);

authRouter.post('/login', validateBody(LoginSchema), authController.login);

authRouter.get('/verify', validateQuery(VerifyEmailLinkSchema), authController.verifyEmailLink);

authRouter.post('/verify-user', authController.verifyUser);

authRouter.post('/ensure-user', authController.ensureUser);

export default authRouter;
