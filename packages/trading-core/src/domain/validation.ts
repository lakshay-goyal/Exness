import type { OrderSide } from '@repo/types';

const parseOrderSide = (value: unknown): OrderSide | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string' && (typeof value !== 'number' || Number.isFinite(value))) {
    return null;
  }
  const stringValue = typeof value === 'string' ? value : String(value);
  const orderType = stringValue.toLowerCase();
  return orderType === 'buy' || orderType === 'sell' ? orderType : null;
};

const parsePositiveNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseNonNegativeNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parseOptionalPositiveNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return parsePositiveNumber(value) ?? undefined;
};

const parseOptionalNonNegativeNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return parseNonNegativeNumber(value) ?? undefined;
};

const parsePositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const tradeInputValidator = {
  parseOrderSide,
  parsePositiveNumber,
  parseNonNegativeNumber,
  parseOptionalPositiveNumber,
  parseOptionalNonNegativeNumber,
  parsePositiveInteger,
};
