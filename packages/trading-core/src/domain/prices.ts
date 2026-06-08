import type { OpenOrder, PriceUpdate } from '@repo/types';
import { marketSymbolMapper } from './symbols';

const normalizePriceValue = (
  value: unknown,
  scale: 'trade' | 'quote' = 'quote',
): number | null => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  if (scale === 'trade' && numericValue > 1_000_000) return numericValue / 10_000;
  if (scale === 'quote' && numericValue > 10_000_000) return numericValue / 100_000_000;
  return numericValue;
};

const normalizeStreamPriceValue = (value: unknown): number | null => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return numericValue > 10_000_000 ? numericValue / 100_000_000 : numericValue;
};

const normalizePriceUpdate = (item: PriceUpdate): PriceUpdate => ({
    ...item,
    price: normalizePriceValue(item.price, 'trade') ?? 0,
    bidValue: normalizePriceValue(item.bidValue, 'quote') ?? 0,
    askValue: normalizePriceValue(item.askValue, 'quote') ?? 0,
  });

const upsertPrice = (prices: PriceUpdate[], item: PriceUpdate): PriceUpdate[] => {
  const normalizedItem = normalizePriceUpdate(item);
  const index = prices.findIndex((price) => price.asset === normalizedItem.asset);
  if (index !== -1) {
    const newPrices = [...prices];
    newPrices[index] = normalizedItem;
    return newPrices;
  }
  return [...prices, normalizedItem];
};

const findPriceForSymbol = (
  prices: PriceUpdate[],
  symbol: string,
): PriceUpdate | undefined => {
  const normalizedSymbol = marketSymbolMapper.normalizeSymbol(symbol);
  const priceAssetName = marketSymbolMapper.getPriceAssetName(symbol);
  return (
    prices.find((price) => {
      if (price.asset === priceAssetName) return true;
      if (price.asset === symbol) return true;
      return price.asset.toUpperCase() === priceAssetName.toUpperCase();
    }) ??
    prices.find((price) => price.asset.toLowerCase() === normalizedSymbol)
  );
};

const getExitPrice = (order: OpenOrder, priceData: PriceUpdate): number => order.type === 'buy' ? priceData.bidValue : priceData.askValue;

const getEntryPrice = (side: 'buy' | 'sell', priceData: PriceUpdate): number => side === 'buy' ? priceData.askValue : priceData.bidValue;

export const priceNormalizer = {
  normalizePriceValue,
  normalizeStreamPriceValue,
  normalizePriceUpdate,
  upsertPrice,
  findPriceForSymbol,
  getExitPrice,
  getEntryPrice,
};
