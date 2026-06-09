import WebSocket from 'ws';
import {
  getBinanceCombinedBookTickerUrl,
  marketSymbolMapper,
  orderCalculator,
  parseBinanceBookTickerMessage,
  priceNormalizer,
} from '@repo/trading-core';
import { openOrders } from '../state/orders.js';
import { prices, type Prices } from '../state/prices.js';
import { closeOpenOrder } from '../orders/close-order.handler.js';

export class BinanceMarketDataService {
  private readonly ws = new WebSocket(getBinanceCombinedBookTickerUrl());

  async start(): Promise<void> {
    this.ws.on('open', () => {
      console.log('Engine connected to Binance bookTicker streams');
    });

    this.ws.on('error', (err: Error) => {
      console.error('Engine Binance WebSocket error:', err);
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      this.handleMessage(data).catch((error: unknown) => {
        console.error('Error handling Binance market data:', error);
      });
    });
  }

  private async handleMessage(data: WebSocket.RawData): Promise<void> {
    const parsed = parseBinanceBookTickerMessage(JSON.parse(data.toString()));
    if (!parsed) return;

    const update: Prices = {
      asset: parsed.asset,
      price: parsed.price,
      bidValue: parsed.bid,
      askValue: parsed.ask,
      decimal: 8,
    };

    prices.splice(0, prices.length, ...priceNormalizer.upsertPrice(prices, update));
    await this.closeTriggeredOrders(new Set([parsed.asset]));
  }

  private async closeTriggeredOrders(updatedAssets: Set<string>): Promise<void> {
    const ordersToCheck = [...openOrders].filter((order) =>
      updatedAssets.has(marketSymbolMapper.getPriceAssetName(order.symbol)),
    );

    for (const order of ordersToCheck) {
      const priceAssetName = marketSymbolMapper.getPriceAssetName(order.symbol);
      const priceData = prices.find((price) => price.asset === priceAssetName);
      if (!priceData) continue;

      const triggerPrice = orderCalculator.getTriggerPrice(order, priceData);
      const closeReason = orderCalculator.getCloseReason(order, triggerPrice);
      if (!closeReason) continue;

      await closeOpenOrder({
        orderId: order.orderId,
        userId: order.userId,
        closeReason,
        sendResponse: false,
      });
    }
  }
}
