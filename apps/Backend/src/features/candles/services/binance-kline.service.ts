interface Candle {
  time: string;
  open: string | number;
  high: string | number;
  low: string | number;
  close: string | number;
  volume?: string | number;
  tradeCount?: string | number;
}

const allowedIntervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

// Binance Kline interval mapping
const intervalMapping: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

// Symbol mapping for Binance API
const symbolMapping: Record<string, string> = {
  BTCUSDT: 'BTCUSDT',
  ETHUSDT: 'ETHUSDT',
  SOLUSDT: 'SOLUSDT',
  BTC_USDC_PERP: 'BTCUSDT',
  ETH_USDC_PERP: 'ETHUSDT',
  SOL_USDC_PERP: 'SOLUSDT',
};

interface BinanceKlineResponse {
  ok: true;
  data: {
    symbol: string;
    interval: string;
    from: string;
    to: string;
    count: number;
    data: Candle[];
  };
}

interface BinanceKlineError {
  ok: false;
  error: string;
  allowedIntervals: string[];
}

type KlineResult = BinanceKlineResponse | BinanceKlineError;

// Binance Kline API response item
// [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]
type BinanceKlineItem = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
  string, // quoteAssetVolume
  number, // numberOfTrades
  string, // takerBuyBaseAssetVolume
  string, // takerBuyQuoteAssetVolume
  string, // ignore
];

class BinanceKlineService {
  private readonly baseUrl = 'https://fapi.binance.com';

  getAllowedIntervals(): string[] {
    return allowedIntervals;
  }

  mapSymbol(inputSymbol: string): string {
    const upperSymbol = inputSymbol.toUpperCase();
    return symbolMapping[upperSymbol] || upperSymbol;
  }

  mapInterval(interval: string): string {
    return intervalMapping[interval] || '1m';
  }

  private getTimeRange(interval: string): { startTime: number; endTime: number; limit: number } {
    const now = Date.now();
    const endTime = now;
    let startTime: number;
    let limit = 500;

    switch (interval) {
      case '1m':
        startTime = now - 24 * 60 * 60 * 1000; // 1 day
        limit = 1440;
        break;
      case '5m':
        startTime = now - 7 * 24 * 60 * 60 * 1000; // 7 days
        limit = 2016;
        break;
      case '15m':
        startTime = now - 14 * 24 * 60 * 60 * 1000; // 14 days
        limit = 1344;
        break;
      case '30m':
        startTime = now - 30 * 24 * 60 * 60 * 1000; // 30 days
        limit = 1440;
        break;
      case '1h':
        startTime = now - 90 * 24 * 60 * 60 * 1000; // 90 days
        limit = 2160;
        break;
      case '4h':
        startTime = now - 365 * 24 * 60 * 60 * 1000; // 1 year
        limit = 2190;
        break;
      case '1d':
        startTime = now - 5 * 365 * 24 * 60 * 60 * 1000; // 5 years
        limit = 1825;
        break;
      default:
        startTime = now - 24 * 60 * 60 * 1000;
        limit = 500;
    }

    // Binance API limit is 1500, adjust if needed
    return { startTime, endTime, limit: Math.min(limit, 1500) };
  }

  private transformKlineData(kline: BinanceKlineItem): Candle {
    const [
      openTime,
      open,
      high,
      low,
      close,
      volume,
      , // closeTime (unused)
      , // quoteAssetVolume (unused)
      numberOfTrades,
    ] = kline;

    return {
      time: new Date(openTime).toISOString(),
      open,
      high,
      low,
      close,
      volume,
      tradeCount: numberOfTrades,
    };
  }

  async getCandles(symbol: string, interval: string): Promise<KlineResult> {
    if (!allowedIntervals.includes(interval)) {
      return {
        ok: false,
        error: 'Invalid interval value',
        allowedIntervals,
      };
    }

    const inputSymbol = symbol.toUpperCase();
    const binanceSymbol = this.mapSymbol(inputSymbol);
    const binanceInterval = this.mapInterval(interval);
    const { startTime, endTime, limit } = this.getTimeRange(interval);

    try {
      const url = new URL(`${this.baseUrl}/fapi/v1/klines`);
      url.searchParams.append('symbol', binanceSymbol);
      url.searchParams.append('interval', binanceInterval);
      url.searchParams.append('startTime', String(startTime));
      url.searchParams.append('endTime', String(endTime));
      url.searchParams.append('limit', String(limit));

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance API error: ${response.status} - ${errorText}`);
      }

      const klines = (await response.json()) as BinanceKlineItem[];
      const candles = klines.map((kline) => this.transformKlineData(kline));

      return {
        ok: true,
        data: {
          symbol: inputSymbol,
          interval,
          from: new Date(startTime).toISOString(),
          to: new Date(endTime).toISOString(),
          count: candles.length,
          data: candles,
        },
      };
    } catch (error) {
      console.error('Error fetching Binance Kline data:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch candle data',
        allowedIntervals,
      };
    }
  }

  // Get diagnostics for the API (no DB needed anymore)
  async getDiagnostics() {
    const testSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const diagnostics: Array<{
      symbol: string;
      interval: string;
      status: string;
      sampleCount?: number;
      error?: string;
    }> = [];

    for (const symbol of testSymbols) {
      try {
        const result = await this.getCandles(symbol, '1m');
        if (result.ok) {
          diagnostics.push({
            symbol,
            interval: '1m',
            status: 'ok',
            sampleCount: result.data.count,
          });
        } else {
          diagnostics.push({
            symbol,
            interval: '1m',
            status: 'error',
            error: result.error,
          });
        }
      } catch (error) {
        diagnostics.push({
          symbol,
          interval: '1m',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      source: 'Binance Futures API (Kline/Candlestick Data)',
      apiEndpoint: `${this.baseUrl}/fapi/v1/klines`,
      supportedIntervals: allowedIntervals,
      supportedSymbols: testSymbols,
      diagnostics,
    };
  }

  // Refresh is no longer needed as we're fetching from live API
  // But we keep this method for API compatibility
  async refreshAggregates(_symbol?: string, _interval?: string, _force?: boolean) {
    return {
      success: true,
      message: 'Refresh not needed - data is fetched directly from Binance API',
      note: 'Binance Kline API provides real-time candle data without requiring local storage',
    };
  }
}

export const binanceKlineService = new BinanceKlineService();
