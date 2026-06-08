import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { tradeController } from './controllers/trade.controller.js';
import { validateBody, validateQuery } from '../../validation/middleware.js';
import {
  CreateOrderSchema,
  CloseOrderSchema,
  GetOrdersQuerySchema,
} from '../../validation/schemas/trading.schemas.js';

const tradeRouter = express.Router();

tradeRouter.get('/', tradeController.hello);

tradeRouter.post(
  '/create',
  authMiddleware,
  validateBody(CreateOrderSchema),
  tradeController.createOrder,
);

tradeRouter.get(
  '/open',
  authMiddleware,
  validateQuery(GetOrdersQuerySchema),
  tradeController.getOpenOrders,
);

tradeRouter.post(
  '/close',
  authMiddleware,
  validateBody(CloseOrderSchema),
  tradeController.closeOrder,
);

tradeRouter.get(
  '/close',
  authMiddleware,
  validateQuery(GetOrdersQuerySchema),
  tradeController.getCloseOrders,
);

export default tradeRouter;
