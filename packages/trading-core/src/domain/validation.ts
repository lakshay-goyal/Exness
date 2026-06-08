import type { OrderSide } from '@repo/types';

export class TradeInputValidator {
  parseOrderSide(value: unknown): OrderSide | null {
    const orderType = String(value ?? '').toLowerCase();
    return orderType === 'buy' || orderType === 'sell' ? orderType : null;
  }

  parsePositiveNumber(value: unknown) {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  parseNonNegativeNumber(value: unknown) {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  parseOptionalPositiveNumber(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    return this.parsePositiveNumber(value);
  }

  parseOptionalNonNegativeNumber(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    return this.parseNonNegativeNumber(value);
  }

  parsePositiveInteger(value: unknown) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
}

export const tradeInputValidator = new TradeInputValidator();
