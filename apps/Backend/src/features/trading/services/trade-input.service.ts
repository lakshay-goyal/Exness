import { tradeInputValidator } from "@repo/trading-core";

export type ValidatedCreateTradeInput =
  | {
      ok: true;
      value: {
        symbol: string;
        type: "buy" | "sell";
        quantity: number;
        leverage: number;
        slippage?: number;
        takeProfit?: number;
        stopLoss?: number;
      };
    }
  | {
      ok: false;
      error: string;
    };

export class TradeInputService {
  validateCreateOrder(body: Record<string, unknown>): ValidatedCreateTradeInput {
    const { symbol, type, quantity, leverage, slippage, takeProfit, stopLoss } = body;

    if (!symbol || !type || !quantity || !leverage) {
      return {
        ok: false,
        error: "Missing required parameters: symbol, type, quantity, leverage",
      };
    }

    const orderSide = tradeInputValidator.parseOrderSide(type);
    if (!orderSide) {
      return { ok: false, error: "Type must be 'buy' or 'sell'" };
    }

    const quantityValue = tradeInputValidator.parsePositiveNumber(quantity);
    if (quantityValue === null) {
      return { ok: false, error: "Quantity must be greater than 0" };
    }

    const leverageValue = tradeInputValidator.parsePositiveInteger(leverage);
    if (leverageValue === null) {
      return { ok: false, error: "Leverage must be a positive whole number" };
    }

    const slippageValue = tradeInputValidator.parseOptionalNonNegativeNumber(slippage);
    if (slippage !== undefined && slippage !== null && slippage !== "" && slippageValue === null) {
      return { ok: false, error: "Slippage must be zero or a positive number" };
    }

    const takeProfitValue = tradeInputValidator.parseOptionalPositiveNumber(takeProfit);
    if (takeProfit !== undefined && takeProfit !== null && takeProfit !== "" && takeProfitValue === null) {
      return { ok: false, error: "Take profit must be greater than 0" };
    }

    const stopLossValue = tradeInputValidator.parseOptionalPositiveNumber(stopLoss);
    if (stopLoss !== undefined && stopLoss !== null && stopLoss !== "" && stopLossValue === null) {
      return { ok: false, error: "Stop loss must be greater than 0" };
    }

    return {
      ok: true,
      value: {
        symbol: String(symbol),
        type: orderSide,
        quantity: quantityValue,
        leverage: leverageValue,
        slippage: slippageValue ?? undefined,
        takeProfit: takeProfitValue ?? undefined,
        stopLoss: stopLossValue ?? undefined,
      },
    };
  }
}

export const tradeInputService = new TradeInputService();
