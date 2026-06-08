import { binanceKlineService } from './binance-kline.service.js';

const allowedIntervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

const symbolMapping: Record<string, string> = {
  BTCUSDT: 'BTCUSDT',
  ETHUSDT: 'ETHUSDT',
  SOLUSDT: 'SOLUSDT',
  BTC_USDC_PERP: 'BTCUSDT',
  ETH_USDC_PERP: 'ETHUSDT',
  SOL_USDC_PERP: 'SOLUSDT',
};

class CandlesService {
  async initDatabase() {
    // No database initialization needed - we use Binance API directly
    console.log('✅ Candle service initialized (using Binance Kline API)');
  }

  getAllowedIntervals() {
    return allowedIntervals;
  }

  mapSymbol(inputSymbol: string) {
    return symbolMapping[inputSymbol] || inputSymbol;
  }

  async getCandles(symbol: string, interval: string) {
    if (!allowedIntervals.includes(interval)) {
      return {
        ok: false as const,
        error: 'Invalid interval value',
        allowedIntervals,
      };
    }

    const inputSymbol = symbol.toUpperCase();
    const result = await binanceKlineService.getCandles(inputSymbol, interval);

    if (!result.ok) {
      return {
        ok: false as const,
        error: result.error,
        allowedIntervals: result.allowedIntervals,
      };
    }

    return {
      ok: true as const,
      data: {
        symbol: inputSymbol,
        dbSymbol: this.mapSymbol(inputSymbol),
        interval,
        from: result.data.from,
        to: result.data.to,
        count: result.data.count,
        data: result.data.data,
      },
    };
  }

  async getDiagnostics() {
    return binanceKlineService.getDiagnostics();
  }

  async refreshAggregates(symbol?: string, interval?: string, force?: boolean) {
    return binanceKlineService.refreshAggregates(symbol, interval, force);
  }
}

export const candlesService = new CandlesService();
