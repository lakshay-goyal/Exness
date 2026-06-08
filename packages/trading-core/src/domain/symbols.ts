import { supportedSymbols, type SupportedMarketAsset, type SupportedSymbol } from '@repo/types';

const symbolToAsset: Record<SupportedSymbol, SupportedMarketAsset> = {
  btc: 'BTC_USDC_PERP',
  eth: 'ETH_USDC_PERP',
  sol: 'SOL_USDC_PERP',
};

const normalizeSymbol = (symbol: string): string => {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes('BTC')) return 'btc';
  if (symbolUpper.includes('ETH')) return 'eth';
  if (symbolUpper.includes('SOL')) return 'sol';
  return symbol.toLowerCase();
};

const isSupportedSymbol = (symbol: string): symbol is SupportedSymbol => supportedSymbols.includes(symbol as SupportedSymbol);

const toSupportedSymbol = (symbol: string): SupportedSymbol | null => {
  const normalized = normalizeSymbol(symbol);
  return isSupportedSymbol(normalized) ? normalized : null;
};

const getPriceAssetName = (symbol: string): string => {
  const normalized = normalizeSymbol(symbol);
  if (isSupportedSymbol(normalized)) return symbolToAsset[normalized];
  return symbol.toUpperCase();
};

const getMarketCode = (symbol: string): string => {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes('BTC')) return 'BTC';
  if (symbolUpper.includes('ETH')) return 'ETH';
  if (symbolUpper.includes('SOL')) return 'SOL';
  return symbolUpper.replace(/[^A-Z0-9]/g, '');
};

const getCanonicalLiveAssetSymbol = (symbol: string): string => `${getMarketCode(symbol)}_USDC_PERP`;

const getMarketName = (symbol: string): string => {
  const marketCode = getMarketCode(symbol);
  if (marketCode === 'BTC') return 'Bitcoin';
  if (marketCode === 'ETH') return 'Ethereum';
  if (marketCode === 'SOL') return 'Solana';
  return marketCode;
};

const getLiveAssetCandidates = (symbol: string): string[] => {
  const marketCode = getMarketCode(symbol);
  return [
    symbol.toUpperCase(),
    getPriceAssetName(symbol),
    `${marketCode}_USDC_PERP`,
    `${marketCode}_USDT_PERP`,
    `${marketCode}USDT`,
    `${marketCode}USD`,
    marketCode,
  ];
};

export const marketSymbolMapper = {
  normalizeSymbol,
  isSupportedSymbol,
  toSupportedSymbol,
  getPriceAssetName,
  getMarketCode,
  getCanonicalLiveAssetSymbol,
  getMarketName,
  getLiveAssetCandidates,
};
