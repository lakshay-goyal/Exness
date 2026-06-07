import {
  supportedSymbols,
  type SupportedMarketAsset,
  type SupportedSymbol,
} from "@repo/contracts";

export class MarketSymbolMapper {
  private readonly symbolToAsset: Record<SupportedSymbol, SupportedMarketAsset> = {
    btc: "BTC_USDC_PERP",
    eth: "ETH_USDC_PERP",
    sol: "SOL_USDC_PERP",
  };

  normalizeSymbol(symbol: string): SupportedSymbol | string {
    const symbolUpper = symbol.toUpperCase();
    if (symbolUpper.includes("BTC")) return "btc";
    if (symbolUpper.includes("ETH")) return "eth";
    if (symbolUpper.includes("SOL")) return "sol";
    return symbol.toLowerCase();
  }

  isSupportedSymbol(symbol: string): symbol is SupportedSymbol {
    return supportedSymbols.includes(symbol as SupportedSymbol);
  }

  toSupportedSymbol(symbol: string): SupportedSymbol | null {
    const normalized = this.normalizeSymbol(symbol);
    return this.isSupportedSymbol(normalized) ? normalized : null;
  }

  getPriceAssetName(symbol: string): string {
    const normalized = this.normalizeSymbol(symbol);
    if (this.isSupportedSymbol(normalized)) return this.symbolToAsset[normalized];
    return symbol.toUpperCase();
  }

  getMarketCode(symbol: string): string {
    const symbolUpper = symbol.toUpperCase();
    if (symbolUpper.includes("BTC")) return "BTC";
    if (symbolUpper.includes("ETH")) return "ETH";
    if (symbolUpper.includes("SOL")) return "SOL";
    return symbolUpper.replace(/[^A-Z0-9]/g, "");
  }

  getCanonicalLiveAssetSymbol(symbol: string): string {
    return `${this.getMarketCode(symbol)}_USDC_PERP`;
  }

  getMarketName(symbol: string): string {
    const marketCode = this.getMarketCode(symbol);
    if (marketCode === "BTC") return "Bitcoin";
    if (marketCode === "ETH") return "Ethereum";
    if (marketCode === "SOL") return "Solana";
    return marketCode;
  }

  getLiveAssetCandidates(symbol: string): string[] {
    const marketCode = this.getMarketCode(symbol);
    return [
      symbol.toUpperCase(),
      this.getPriceAssetName(symbol),
      `${marketCode}_USDC_PERP`,
      `${marketCode}_USDT_PERP`,
      `${marketCode}USDT`,
      `${marketCode}USD`,
      marketCode,
    ];
  }
}

export const marketSymbolMapper = new MarketSymbolMapper();
