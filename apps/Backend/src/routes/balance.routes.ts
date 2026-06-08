import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { balanceController } from '../features/balance/controllers/balance.controller.js';

const balanceRouter = express.Router();

balanceRouter.get('/', authMiddleware as any, balanceController.getBalance);

export default balanceRouter;
