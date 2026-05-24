"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createChart, ColorType } from "lightweight-charts";
import type {
  CandlestickData,
  IPriceLine,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  Activity,
  Menu,
  Minus,
  MoreHorizontal,
  Plus,
  Settings,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

interface OpenOrder {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  leverage: number;
  openPrice: number;
  currentPrice: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  pnl: number;
  status: string;
}

interface BackendOpenOrder {
  orderId: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  leverage?: number;
  openPrice: number;
  currentPrice: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  status: "open";
}

interface BackendClosedOrder {
  orderId: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  profitLoss?: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  closeReason?: string | null;
}

interface CloseOrder {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  takeProfit?: number | null;
  stopLoss?: number | null;
  pnl: number;
  closeReason?: string | null;
  status: string;
}

type CryptoAsset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  signal: "buy" | "sell";
  bid: number;
  ask: number;
  lastUpdated?: number;
};

type CandleResponse = {
  data: Array<{
    open: string;
    high: string;
    low: string;
    close: string;
    time: string;
  }>;
};

type OpenOrdersResponse = {
  message?: string;
};

type ClosedOrdersResponse = {
  message?: BackendClosedOrder[];
};

interface TradingViewChartProps {
  selectedAsset?: string;
  livePrice?: number;
  liveBid?: number;
  liveAsk?: number;
  liveUpdatedAt?: number;
}

const intervalSeconds: Record<string, number> = {
  "1m": 60,
  "5m": 5 * 60,
  "15m": 15 * 60,
  "30m": 30 * 60,
  "1h": 60 * 60,
  "4h": 4 * 60 * 60,
  "1d": 24 * 60 * 60,
};

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
};

const formatCurrency = (value?: number | null, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

const formatNumber = (value?: number | null, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatPercent = (value?: number | null, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${formatNumber(value, digits)}%`;
};

const normalizeMarketPrice = (value?: number | null) => {
  if (value === null || value === undefined) return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  return numericValue > 10_000_000 ? numericValue / 100_000_000 : numericValue;
};

const marketPriceDigits = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 2;
  if (Math.abs(value) < 1) return 5;
  if (Math.abs(value) < 100) return 3;
  return 2;
};

const formatMarketPrice = (value?: number | null) => {
  const normalizedValue = normalizeMarketPrice(value);
  return formatNumber(normalizedValue, marketPriceDigits(normalizedValue));
};

const getLiveAssetKeyForSymbol = (symbol: string) => {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes("_")) return symbolUpper;
  if (symbolUpper.includes("BTC")) return "BTC_USDC_PERP";
  if (symbolUpper.includes("ETH")) return "ETH_USDC_PERP";
  if (symbolUpper.includes("SOL")) return "SOL_USDC_PERP";
  return symbolUpper;
};

const getMarketCode = (symbol: string) => {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes("BTC")) return "BTC";
  if (symbolUpper.includes("ETH")) return "ETH";
  if (symbolUpper.includes("SOL")) return "SOL";
  return symbolUpper.replace(/[^A-Z0-9]/g, "");
};

const getLiveAssetCandidates = (symbol: string) => {
  const marketCode = getMarketCode(symbol);
  return [
    symbol.toUpperCase(),
    getLiveAssetKeyForSymbol(symbol),
    `${marketCode}_USDC_PERP`,
    `${marketCode}USDT`,
    marketCode,
  ];
};

const findLiveAssetForOrder = (
  order: OpenOrder,
  liveData: Record<string, CryptoAsset>
) => {
  const candidates = getLiveAssetCandidates(order.symbol);
  return candidates.map((candidate) => liveData[candidate]).find(Boolean);
};

const getOrderPnl = (order: OpenOrder, currentPrice: number) => {
  return order.type === "Buy"
    ? (currentPrice - order.openPrice) * order.volume
    : (order.openPrice - currentPrice) * order.volume;
};

const getOrderMargin = (order: OpenOrder) => {
  const leverage = order.leverage > 0 ? order.leverage : 100;
  return (order.volume * order.openPrice) / leverage;
};

const isCanceledRequest = (error: unknown) => {
  return (
    axios.isCancel(error) ||
    (error instanceof Error &&
      (error.name === "CanceledError" || error.message.includes("canceled")))
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex h-full min-h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
    {label}
  </div>
);

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  selectedAsset = "BTCUSDT",
  livePrice,
  liveBid,
  liveAsk,
  liveUpdatedAt,
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const currentPriceLineRef = useRef<IPriceLine | null>(null);
  const bidPriceLineRef = useRef<IPriceLine | null>(null);
  const askPriceLineRef = useRef<IPriceLine | null>(null);
  const livePriceRef = useRef<number | undefined>(livePrice);
  const liveBidRef = useRef<number | undefined>(liveBid);
  const liveAskRef = useRef<number | undefined>(liveAsk);
  const liveUpdatedAtRef = useRef<number | undefined>(liveUpdatedAt);
  const asset = selectedAsset || "BTCUSDT";
  const [time, setTime] = useState("1m");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeIntervals = [
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "30m", label: "30m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1d", label: "1D" },
  ];

  useEffect(() => {
    livePriceRef.current = livePrice;
    liveBidRef.current = liveBid;
    liveAskRef.current = liveAsk;
    liveUpdatedAtRef.current = liveUpdatedAt;
  }, [liveAsk, liveBid, livePrice, liveUpdatedAt]);

  const applyLiveTickToChart = useCallback(
    (price?: number, updatedAt?: number, bid?: number, ask?: number) => {
      const series = candlestickSeriesRef.current;
      if (!series || price === undefined || Number.isNaN(price)) return;

      const updatePriceLine = (
        lineRef: React.MutableRefObject<IPriceLine | null>,
        linePrice: number | undefined,
        title: string,
        color: string,
        lineStyle: 0 | 1 | 2 | 3 | 4 = 2
      ) => {
        if (linePrice === undefined || Number.isNaN(linePrice)) return;

        const priceLineOptions = {
          price: linePrice,
          color,
          lineWidth: 1 as const,
          lineStyle,
          axisLabelVisible: true,
          title: `${title} ${formatMarketPrice(linePrice)}`,
        };

        if (lineRef.current) {
          lineRef.current.applyOptions(priceLineOptions);
          return;
        }

        lineRef.current = series.createPriceLine(priceLineOptions);
      };

      updatePriceLine(currentPriceLineRef, price, "Price", "#38bdf8");
      updatePriceLine(bidPriceLineRef, bid, "Bid", "#22c55e", 1);
      updatePriceLine(askPriceLineRef, ask, "Ask", "#ef4444", 1);

      const interval = intervalSeconds[time] ?? 60;
      const liveTime = (Math.floor(
        ((updatedAt ?? Date.now()) / 1000) / interval
      ) * interval) as UTCTimestamp;
      const lastCandle = lastCandleRef.current;

      const nextCandle: CandlestickData = lastCandle
        ? liveTime > (lastCandle.time as UTCTimestamp)
          ? {
              time: liveTime,
              open: lastCandle.close,
              high: Math.max(lastCandle.close, price),
              low: Math.min(lastCandle.close, price),
              close: price,
            }
          : {
              ...lastCandle,
              high: Math.max(lastCandle.high, price),
              low: Math.min(lastCandle.low, price),
              close: price,
            }
        : {
            time: liveTime,
            open: price,
            high: price,
            low: price,
            close: price,
          };

      series.update(nextCandle);
      lastCandleRef.current = nextCandle;
    },
    [time]
  );

  async function fetchCandles(assetName: string, interval: string) {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get<CandleResponse>(
        `${getBackendUrl()}/api/v1/candles?symbol=${assetName}&interval=${interval}`,
        { timeout: 10000 }
      );

      return response.data.data.map((candle) => ({
        open: Number.parseFloat(candle.open),
        high: Number.parseFloat(candle.high),
        low: Number.parseFloat(candle.low),
        close: Number.parseFloat(candle.close),
        time: Math.floor(new Date(candle.time).getTime() / 1000) as UTCTimestamp,
      }));
    } catch (chartError) {
      console.error("Error fetching candles:", chartError);
      setError("Chart data is unavailable");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!chartRef.current) return;

    const host = chartRef.current;
    const hostRect = host.getBoundingClientRect();
    const chart = createChart(host, {
      layout: {
        textColor: "#cbd5e1",
        background: { type: ColorType.Solid, color: "#0f172a" },
      },
      width: Math.max(Math.floor(hostRect.width), 320),
      height: Math.max(Math.floor(hostRect.height), 260),
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.16)" },
        horzLines: { color: "rgba(148, 163, 184, 0.16)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(148, 163, 184, 0.24)",
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.24)",
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#60a5fa",
          width: 1,
          style: 3,
        },
        horzLine: {
          color: "#60a5fa",
          width: 1,
          style: 3,
        },
      },
    });

    const candlestick = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });
    candlestickSeriesRef.current = candlestick;
    lastCandleRef.current = null;
    currentPriceLineRef.current = null;
    bidPriceLineRef.current = null;
    askPriceLineRef.current = null;
    let isDisposed = false;

    const loadData = async () => {
      const candles = await fetchCandles(asset, time);
      if (isDisposed) return;

      if (candles) {
        candlestick.setData(candles);
        lastCandleRef.current = candles.at(-1) ?? null;
        applyLiveTickToChart(
          livePriceRef.current,
          liveUpdatedAtRef.current,
          liveBidRef.current,
          liveAskRef.current
        );
        chart.timeScale().fitContent();
      }
    };

    const resizeChart = () => {
      const rect = host.getBoundingClientRect();
      chart.applyOptions({
        width: Math.max(Math.floor(rect.width), 320),
        height: Math.max(Math.floor(rect.height), 220),
      });
    };

    loadData();
    resizeChart();

    const observer = new ResizeObserver(resizeChart);
    observer.observe(host);

    return () => {
      isDisposed = true;
      observer.disconnect();
      candlestickSeriesRef.current = null;
      lastCandleRef.current = null;
      currentPriceLineRef.current = null;
      bidPriceLineRef.current = null;
      askPriceLineRef.current = null;
      chart.remove();
    };
  }, [applyLiveTickToChart, asset, time]);

  useEffect(() => {
    applyLiveTickToChart(livePrice, liveUpdatedAt, liveBid, liveAsk);
  }, [applyLiveTickToChart, liveAsk, liveBid, livePrice, liveUpdatedAt]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-slate-950 shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wide text-slate-400">
            Live candlestick chart
          </p>
          <p className="truncate font-mono text-sm font-semibold text-white">{asset}</p>
        </div>
        <div className="flex max-w-full shrink-0 items-center gap-1 overflow-x-auto">
          {timeIntervals.map((interval) => (
            <button
              key={interval.value}
              className={`h-7 rounded-md px-2 text-xs transition-colors ${
                time === interval.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              onClick={() => setTime(interval.value)}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60">
            <div className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white shadow-sm">
              <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              Loading chart
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <Activity className="size-5" />
              </div>
              <p className="text-sm font-medium text-red-200">{error}</p>
              <p className="mt-1 text-xs text-slate-400">
                Check the candle service or pick another interval.
              </p>
            </div>
          </div>
        )}

        <div ref={chartRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [realTimeCryptoData, setRealTimeCryptoData] = useState<
    Record<string, CryptoAsset>
  >({});
  const [orderVolume, setOrderVolume] = useState("0.01");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [closeOrdersData, setCloseOrdersData] = useState<CloseOrder[]>([]);
  const [activeTab, setActiveTab] = useState("open");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [createOrderLoading, setCreateOrderLoading] = useState(false);
  const [closeOrderLoading, setCloseOrderLoading] = useState(false);
  const [openOrdersLoading, setOpenOrdersLoading] = useState(false);
  const [closedOrdersLoading, setClosedOrdersLoading] = useState(false);

  const router = useRouter();
  const { token, isAuthenticated, balance, fetchBalance } = useAuth();

  const openOrdersControllerRef = useRef<AbortController | null>(null);
  const closeOrdersControllerRef = useRef<AbortController | null>(null);
  const selectedSymbolRef = useRef<string | null>(null);
  const lastFetchTimeRef = useRef<{ open: number; close: number }>({
    open: 0,
    close: 0,
  });

  const cryptoAssets = useMemo(
    () =>
      Object.values(realTimeCryptoData).sort((a, b) =>
        a.symbol.localeCompare(b.symbol)
      ),
    [realTimeCryptoData]
  );
  const liveOrders = useMemo(
    () =>
      orders.map((order) => {
        const liveAsset = findLiveAssetForOrder(order, realTimeCryptoData);
        const currentPrice = liveAsset
          ? order.type === "Buy"
            ? liveAsset.bid
            : liveAsset.ask
          : order.currentPrice;
        const pnl = getOrderPnl(order, currentPrice);

        return {
          ...order,
          currentPrice,
          pnl,
        };
      }),
    [orders, realTimeCryptoData]
  );
  const openActiveOrders = useMemo(
    () => liveOrders.filter((order) => order.status === "open"),
    [liveOrders]
  );
  const orderVolumeNumber = Number.parseFloat(orderVolume) || 0;
  const marginRequired = selectedCrypto
    ? (selectedCrypto.price * orderVolumeNumber) / 100
    : 0;
  const reservedMargin = useMemo(
    () => openActiveOrders.reduce((total, order) => total + getOrderMargin(order), 0),
    [openActiveOrders]
  );
  const floatingPnl = useMemo(
    () => openActiveOrders.reduce((total, order) => total + order.pnl, 0),
    [openActiveOrders]
  );
  const accountBalance = balance !== null ? balance + reservedMargin : null;
  const accountEquity =
    accountBalance !== null ? accountBalance + floatingPnl : null;
  const accountFreeMargin =
    accountEquity !== null ? accountEquity - reservedMargin : null;
  const accountMarginLevel =
    accountEquity !== null && reservedMargin > 0
      ? (accountEquity / reservedMargin) * 100
      : null;
  const estimatedFreeMargin =
    accountFreeMargin !== null ? accountFreeMargin - marginRequired : null;
  const spread = selectedCrypto
    ? Math.max(selectedCrypto.ask - selectedCrypto.bid, 0)
    : null;
  const priceIsPositive = (selectedCrypto?.change ?? 0) >= 0;
  const marketCount = cryptoAssets.length;

  useEffect(() => {
    selectedSymbolRef.current = selectedCrypto?.symbol ?? null;
  }, [selectedCrypto?.symbol]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
      setRightPanelOpen(false);
    }
  }, []);

  const fetchOpenOrders = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    if (openOrdersControllerRef.current) {
      openOrdersControllerRef.current.abort();
    }

    const now = Date.now();
    if (now - lastFetchTimeRef.current.open < 500) return;
    lastFetchTimeRef.current.open = now;

    const controller = new AbortController();
    openOrdersControllerRef.current = controller;

    setOpenOrdersLoading(true);
    try {
      const response = await axios.get<OpenOrdersResponse>(
        `${getBackendUrl()}/api/v1/trade/open/`,
        {
          signal: controller.signal,
          timeout: 10000,
        }
      );
      const data = response.data;

      if (data.message) {
        const parsedOrders = JSON.parse(data.message) as BackendOpenOrder[];

        setOrders(
          parsedOrders.map((orderData) => {
            const openPrice = normalizeMarketPrice(orderData.openPrice) ?? 0;
            const currentPrice = normalizeMarketPrice(orderData.currentPrice) ?? openPrice;

            return {
              id: orderData.orderId,
              symbol: orderData.symbol.toUpperCase(),
              type: orderData.type === "buy" ? "Buy" : "Sell",
              volume: orderData.quantity,
              leverage: Number(orderData.leverage) || 100,
              openPrice,
              currentPrice,
              takeProfit: normalizeMarketPrice(orderData.takeProfit),
              stopLoss: normalizeMarketPrice(orderData.stopLoss),
              pnl:
                orderData.type === "buy"
                  ? (currentPrice - openPrice) * orderData.quantity
                  : (openPrice - currentPrice) * orderData.quantity,
              status: orderData.status,
            };
          })
        );
      } else {
        setOrders([]);
      }
    } catch (error: unknown) {
      if (!isCanceledRequest(error)) {
        console.error("Error fetching open orders:", error);
        setOrders([]);
      }
    } finally {
      setOpenOrdersLoading(false);
      if (openOrdersControllerRef.current === controller) {
        openOrdersControllerRef.current = null;
      }
    }
  }, [isAuthenticated, token]);

  const fetchCloseOrders = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    if (closeOrdersControllerRef.current) {
      closeOrdersControllerRef.current.abort();
    }

    const now = Date.now();
    if (now - lastFetchTimeRef.current.close < 500) return;
    lastFetchTimeRef.current.close = now;

    const controller = new AbortController();
    closeOrdersControllerRef.current = controller;

    setClosedOrdersLoading(true);
    try {
      const response = await axios.get<ClosedOrdersResponse>(
        `${getBackendUrl()}/api/v1/trade/close`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          timeout: 10000,
        }
      );
      const data = response.data;

      if (data.message && Array.isArray(data.message)) {
        setCloseOrdersData(
          data.message.map((orderData) => ({
            id: orderData.orderId,
            symbol: orderData.symbol.toUpperCase(),
            type: orderData.type === "buy" ? "Buy" : "Sell",
            volume: orderData.quantity,
            openPrice: normalizeMarketPrice(orderData.openPrice) ?? 0,
            closePrice: normalizeMarketPrice(orderData.closePrice) ?? 0,
            openTime: orderData.openTime,
            closeTime: orderData.closeTime,
            takeProfit: normalizeMarketPrice(orderData.takeProfit),
            stopLoss: normalizeMarketPrice(orderData.stopLoss),
            pnl: orderData.profitLoss || 0,
            closeReason: orderData.closeReason || "manual",
            status: "closed",
          }))
        );
      } else {
        setCloseOrdersData([]);
      }
    } catch (error: unknown) {
      if (!isCanceledRequest(error)) {
        console.error("Error fetching closed orders:", error);
        setCloseOrdersData([]);
      }
    } finally {
      setClosedOrdersLoading(false);
      if (closeOrdersControllerRef.current === controller) {
        closeOrdersControllerRef.current = null;
      }
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const refreshOrders = () => {
      fetchOpenOrders();
      fetchCloseOrders();
    };

    const timer = setTimeout(refreshOrders, 100);
    const interval = setInterval(() => {
      refreshOrders();
      fetchBalance();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      openOrdersControllerRef.current?.abort();
      closeOrdersControllerRef.current?.abort();
    };
  }, [fetchBalance, fetchCloseOrders, fetchOpenOrders, isAuthenticated, token]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/");

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        const data =
          typeof parsedData === "string" ? JSON.parse(parsedData) : parsedData;

        if (!data.asset || !data.bid || !data.ask) return;

        setRealTimeCryptoData((prevData) => {
          const symbol = String(data.asset).toUpperCase();
          const prevAsset = prevData[symbol];
          const bidPrice = normalizeMarketPrice(data.bid);
          const askPrice = normalizeMarketPrice(data.ask);
          if (bidPrice === null || askPrice === null) return prevData;

          const newPrice = (bidPrice + askPrice) / 2;

          if (prevAsset) {
            const change = newPrice - prevAsset.price;
            const changePercent =
              prevAsset.price === 0 ? 0 : (change / prevAsset.price) * 100;

            const updatedAsset: CryptoAsset = {
              ...prevAsset,
              price: newPrice,
              bid: bidPrice,
              ask: askPrice,
              change,
              changePercent,
              signal: change >= 0 ? "buy" : "sell",
              lastUpdated: Date.now(),
            };

            if (selectedSymbolRef.current === symbol) setSelectedCrypto(updatedAsset);

            return { ...prevData, [symbol]: updatedAsset };
          }

          return {
            ...prevData,
            [symbol]: {
              symbol,
              name: symbol.replace("USDT", ""),
              price: newPrice,
              bid: bidPrice,
              ask: askPrice,
              change: 0,
              changePercent: 0,
              signal: "buy",
              lastUpdated: Date.now(),
            },
          };
        });

        setOrders((prevOrders) => {
          const symbol = String(data.asset).toUpperCase();
          const bidPrice = normalizeMarketPrice(data.bid);
          const askPrice = normalizeMarketPrice(data.ask);
          if (bidPrice === null || askPrice === null) return prevOrders;

          return prevOrders.map((order) => {
            const matchesMarket = getLiveAssetCandidates(order.symbol).includes(symbol);
            if (!matchesMarket) return order;

            const currentPrice = order.type === "Buy" ? bidPrice : askPrice;
            return {
              ...order,
              currentPrice,
              pnl: getOrderPnl(order, currentPrice),
            };
          });
        });
      } catch (socketError) {
        console.error("Unable to parse WebSocket tick:", socketError);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (selectedCrypto || cryptoAssets.length === 0) return;

    const nextAsset = realTimeCryptoData.BTCUSDT ?? cryptoAssets[0];
    if (nextAsset) setSelectedCrypto(nextAsset);
  }, [cryptoAssets, realTimeCryptoData, selectedCrypto]);

  const handleOrder = async (type: "buy" | "sell") => {
    if (!selectedCrypto) return;

    if (!token || !isAuthenticated) {
      router.push("/login");
      return;
    }

    const entryPrice = type === "buy" ? selectedCrypto.ask : selectedCrypto.bid;
    const takeProfitValue = takeProfit ? Number.parseFloat(takeProfit) : undefined;
    const stopLossValue = stopLoss ? Number.parseFloat(stopLoss) : undefined;

    if (!Number.isFinite(orderVolumeNumber) || orderVolumeNumber <= 0) {
      alert("Volume must be greater than 0.");
      return;
    }

    if (
      (takeProfitValue !== undefined && (!Number.isFinite(takeProfitValue) || takeProfitValue <= 0)) ||
      (stopLossValue !== undefined && (!Number.isFinite(stopLossValue) || stopLossValue <= 0))
    ) {
      alert("Take profit and stop loss must be positive numbers.");
      return;
    }

    if (
      takeProfitValue !== undefined &&
      (type === "buy" ? takeProfitValue <= entryPrice : takeProfitValue >= entryPrice)
    ) {
      alert(
        type === "buy"
          ? "For buy orders, take profit must be above the buy price."
          : "For sell orders, take profit must be below the sell price."
      );
      return;
    }

    if (
      stopLossValue !== undefined &&
      (type === "buy" ? stopLossValue >= entryPrice : stopLossValue <= entryPrice)
    ) {
      alert(
        type === "buy"
          ? "For buy orders, stop loss must be below the buy price."
          : "For sell orders, stop loss must be above the sell price."
      );
      return;
    }

    setCreateOrderLoading(true);
    try {
      const response = await axios.post(`${getBackendUrl()}/api/v1/trade/create`, {
        symbol: selectedCrypto.symbol,
        type,
        quantity: orderVolumeNumber,
        leverage: 100,
        slippage: slippage ? Number.parseFloat(slippage) : undefined,
        takeProfit: takeProfitValue,
        stopLoss: stopLossValue,
      });

      if (response.data.message) {
        await fetchOpenOrders();
        await fetchBalance();
        alert("Order created successfully!");
      } else {
        alert("Failed to create order.");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order. Please try again.");
    } finally {
      setCreateOrderLoading(false);
    }
  };

  const handleCloseOrder = async (orderId: string) => {
    if (!token || !isAuthenticated) {
      router.push("/login");
      return;
    }

    setCloseOrderLoading(true);
    try {
      const response = await axios.post(`${getBackendUrl()}/api/v1/trade/close`, {
        orderId,
      });

      if (response.data.message) {
        alert("Order closed successfully!");
        await fetchOpenOrders();
        await fetchCloseOrders();
        await fetchBalance();
      } else {
        alert("Failed to close order.");
      }
    } catch (error) {
      console.error("Error closing order:", error);
      alert("Error closing order. Please try again.");
    } finally {
      setCloseOrderLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <Navbar showNavLinks={false} />

        <div className="mt-16 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel defaultSize={72} minSize={48}>
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  {sidebarOpen && (
                    <>
                      <ResizablePanel
                        defaultSize={21}
                        minSize={14}
                        maxSize={34}
                        className="min-w-0"
                      >
                        <aside className="flex h-full min-w-0 flex-col border-r bg-card/35">
                          <div className="shrink-0 border-b p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h2 className="truncate text-sm font-semibold uppercase tracking-wide">
                                  Instruments
                                </h2>
                                <p className="truncate text-xs text-muted-foreground">
                                  {marketCount} streaming markets
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Hide instruments"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            <div className="space-y-2">
                              {cryptoAssets.length === 0 ? (
                                <EmptyState label="Waiting for live prices" />
                              ) : (
                                cryptoAssets.map((crypto) => (
                                  <button
                                    key={crypto.symbol}
                                    className={`w-full rounded-lg border p-3 text-left transition hover:bg-accent/50 ${
                                      selectedCrypto?.symbol === crypto.symbol
                                        ? "border-primary/50 bg-primary/10"
                                        : "bg-background"
                                    }`}
                                    onClick={() => {
                                      setSelectedCrypto(crypto);
                                    }}
                                  >
                                    <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span
                                          className={`size-2 rounded-full ${
                                            crypto.signal === "buy"
                                              ? "bg-emerald-500"
                                              : "bg-red-500"
                                          }`}
                                        />
                                        <span className="truncate text-sm font-semibold">
                                          {crypto.symbol}
                                        </span>
                                      </div>
                                      <Badge
                                        variant={
                                          crypto.signal === "buy"
                                            ? "default"
                                            : "destructive"
                                        }
                                        className="shrink-0 px-2 py-0 text-xs"
                                      >
                                        {crypto.signal === "buy" ? (
                                          <TrendingUp className="size-3" />
                                        ) : (
                                          <TrendingDown className="size-3" />
                                        )}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="min-w-0">
                                        <p className="text-muted-foreground">Bid / Ask</p>
                                        <p className="truncate font-mono">
                                          {formatMarketPrice(crypto.bid)} /{" "}
                                          {formatMarketPrice(crypto.ask)}
                                        </p>
                                      </div>
                                      <div className="min-w-0 text-right">
                                        <p className="text-muted-foreground">Price</p>
                                        <p className="truncate font-mono">
                                          {formatCurrency(crypto.price)}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </aside>
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                    </>
                  )}

                  <ResizablePanel defaultSize={58} minSize={34} className="min-w-0">
                    <main className="flex h-full min-w-0 flex-col overflow-hidden bg-muted/20">
                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card/60 px-3 py-3">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            {!sidebarOpen && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Show instruments"
                              >
                                <Menu className="size-4" />
                              </Button>
                            )}
                            <span className="truncate text-sm font-semibold">
                              {selectedCrypto?.name || "No market selected"}
                            </span>
                            <Badge variant="outline" className="shrink-0 font-mono">
                              {selectedCrypto?.symbol || "--"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-2xl font-semibold leading-none">
                              {formatCurrency(selectedCrypto?.price)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm ${
                                priceIsPositive
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {priceIsPositive ? (
                                <TrendingUp className="size-4" />
                              ) : (
                                <TrendingDown className="size-4" />
                              )}
                              {selectedCrypto
                                ? `${selectedCrypto.change >= 0 ? "+" : ""}${formatNumber(
                                    selectedCrypto.change
                                  )} (${formatNumber(selectedCrypto.changePercent)}%)`
                                : "--"}
                            </span>
                            <span className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                              Bid {formatMarketPrice(selectedCrypto?.bid)}
                            </span>
                            <span className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                              Ask {formatMarketPrice(selectedCrypto?.ask)}
                            </span>
                            <span className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                              Spread {formatMarketPrice(spread)}
                            </span>
                          </div>
                        </div>
                        {!rightPanelOpen && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            onClick={() => setRightPanelOpen(true)}
                            aria-label="Show trading panel"
                          >
                            <Settings className="size-4" />
                          </Button>
                        )}
                      </div>

                      <div className="min-h-0 flex-1 p-3">
                        <Card className="h-full min-h-0 rounded-lg py-0 shadow-none">
                          <CardContent className="h-full min-h-0 p-2">
                            <TradingViewChart
                              selectedAsset={selectedCrypto?.symbol}
                              livePrice={selectedCrypto?.price}
                              liveBid={selectedCrypto?.bid}
                              liveAsk={selectedCrypto?.ask}
                              liveUpdatedAt={selectedCrypto?.lastUpdated}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </main>
                  </ResizablePanel>

                  {rightPanelOpen && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel
                        defaultSize={21}
                        minSize={16}
                        maxSize={34}
                        className="min-w-0"
                      >
                        <aside className="flex h-full min-w-0 flex-col border-l bg-card/35">
                          <div className="shrink-0 border-b p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h2 className="truncate text-sm font-semibold uppercase tracking-wide">
                                  Trading Panel
                                </h2>
                                <p className="truncate text-xs text-muted-foreground">
                                  {selectedCrypto?.symbol || "Select a market"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setRightPanelOpen(false)}
                                aria-label="Hide trading panel"
                              >
                                <X className="size-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => handleOrder("sell")}
                                variant="destructive"
                                className="h-14 flex-col"
                                disabled={createOrderLoading || !selectedCrypto}
                              >
                                <span className="text-base font-semibold">
                                  Sell {createOrderLoading && "..."}
                                </span>
                                <span className="font-mono text-xs opacity-90">
                                  {formatMarketPrice(selectedCrypto?.bid)}
                                </span>
                              </Button>
                              <Button
                                onClick={() => handleOrder("buy")}
                                className="h-14 flex-col bg-emerald-600 hover:bg-emerald-700"
                                disabled={createOrderLoading || !selectedCrypto}
                              >
                                <span className="text-base font-semibold">
                                  Buy {createOrderLoading && "..."}
                                </span>
                                <span className="font-mono text-xs opacity-90">
                                  {formatMarketPrice(selectedCrypto?.ask)}
                                </span>
                              </Button>
                            </div>
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            <div className="space-y-4">
                              <div>
                                <label className="mb-2 block text-xs text-muted-foreground">
                                  Volume
                                </label>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    onClick={() =>
                                      setOrderVolume(
                                        Math.max(0.01, orderVolumeNumber - 0.01).toFixed(
                                          2
                                        )
                                      )
                                    }
                                    disabled={createOrderLoading}
                                  >
                                    <Minus className="size-3" />
                                  </Button>
                                  <Input
                                    value={orderVolume}
                                    onChange={(event) =>
                                      setOrderVolume(event.target.value)
                                    }
                                    className="h-8 min-w-0 text-center text-sm"
                                    disabled={createOrderLoading}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 shrink-0"
                                    onClick={() =>
                                      setOrderVolume((orderVolumeNumber + 0.01).toFixed(2))
                                    }
                                    disabled={createOrderLoading}
                                  >
                                    <Plus className="size-3" />
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <label className="mb-2 block text-xs text-muted-foreground">
                                  Take Profit
                                </label>
                                <Input
                                  placeholder="Not set"
                                  value={takeProfit}
                                  onChange={(event) => setTakeProfit(event.target.value)}
                                  className="h-8 text-sm"
                                  disabled={createOrderLoading}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs text-muted-foreground">
                                  Stop Loss
                                </label>
                                <Input
                                  placeholder="Not set"
                                  value={stopLoss}
                                  onChange={(event) => setStopLoss(event.target.value)}
                                  className="h-8 text-sm"
                                  disabled={createOrderLoading}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs text-muted-foreground">
                                  Slippage (%)
                                </label>
                                <Input
                                  placeholder="0.5"
                                  value={slippage}
                                  onChange={(event) => setSlippage(event.target.value)}
                                  className="h-8 text-sm"
                                  disabled={createOrderLoading}
                                  type="number"
                                  step="0.1"
                                  min="0"
                                />
                              </div>

                              <Card className="rounded-lg bg-accent/30 py-0 shadow-none">
                                <CardContent className="space-y-2 p-3 text-xs">
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">
                                      Margin Required
                                    </span>
                                    <span className="font-mono">
                                      {formatCurrency(marginRequired)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">
                                      Free Margin
                                    </span>
                                    <span
                                      className={`font-mono ${
                                        (estimatedFreeMargin ?? 0) >= 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {formatCurrency(estimatedFreeMargin)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <span className="text-muted-foreground">
                                      Leverage
                                    </span>
                                    <span className="font-mono">100x</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </aside>
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={28} minSize={16} maxSize={46}>
                <section className="flex h-full min-h-0 flex-col border-t bg-card/35">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex h-full min-h-0 flex-col"
                  >
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
                      <TabsList className="h-8">
                        <TabsTrigger value="open" className="text-xs">
                          Open ({openOrdersLoading ? "..." : openActiveOrders.length})
                        </TabsTrigger>
                        <TabsTrigger value="closed" className="text-xs">
                          Closed ({closedOrdersLoading ? "..." : closeOrdersData.length})
                        </TabsTrigger>
                      </TabsList>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Close all
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Order options"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                      <TabsContent value="open" className="m-0 h-full p-3">
                        <div className="h-full overflow-auto rounded-md border bg-background">
                          <div className="min-w-[980px]">
                            <div className="grid grid-cols-[1fr_0.65fr_0.65fr_1fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                              <div>Symbol</div>
                              <div>Type</div>
                              <div>Volume</div>
                              <div>Open Price</div>
                              <div>Current</div>
                              <div>Take Profit</div>
                              <div>Stop Loss</div>
                              <div>P/L</div>
                              <div>Action</div>
                            </div>
                            {openOrdersLoading ? (
                              <div className="p-6 text-center text-sm text-muted-foreground">
                                Loading open orders
                              </div>
                            ) : openActiveOrders.length > 0 ? (
                              openActiveOrders.map((order) => (
                                <div
                                  key={order.id}
                                  className="grid grid-cols-[1fr_0.65fr_0.65fr_1fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-3 px-3 py-2 text-sm hover:bg-accent/30"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500" />
                                    <span className="truncate font-medium">
                                      {order.symbol}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`size-2 rounded-full ${
                                        order.type === "Buy"
                                          ? "bg-emerald-500"
                                          : "bg-red-500"
                                      }`}
                                    />
                                    {order.type}
                                  </div>
                                  <div className="font-mono">
                                    {formatNumber(order.volume)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.openPrice)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.currentPrice)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.takeProfit)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.stopLoss)}
                                  </div>
                                  <div
                                    className={`font-mono ${
                                      order.pnl >= 0
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {order.pnl >= 0 ? "+" : ""}
                                    {formatCurrency(order.pnl)}
                                  </div>
                                  <div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleCloseOrder(order.id)}
                                      disabled={closeOrderLoading}
                                      aria-label={`Close ${order.symbol} order`}
                                    >
                                      {closeOrderLoading ? (
                                        <span className="text-xs">...</span>
                                      ) : (
                                        <X className="size-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-6 text-center text-sm text-muted-foreground">
                                No open orders
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="closed" className="m-0 h-full p-3">
                        <div className="h-full overflow-auto rounded-md border bg-background">
                          <div className="min-w-[1240px]">
                            <div className="grid grid-cols-[1fr_0.65fr_0.65fr_1fr_1fr_1fr_1fr_1.25fr_1.25fr_0.8fr_0.9fr] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                              <div>Symbol</div>
                              <div>Type</div>
                              <div>Volume</div>
                              <div>Open Price</div>
                              <div>Close Price</div>
                              <div>Take Profit</div>
                              <div>Stop Loss</div>
                              <div>Open Time</div>
                              <div>Close Time</div>
                              <div>P/L</div>
                              <div>Closed By</div>
                            </div>
                            {closedOrdersLoading ? (
                              <div className="p-6 text-center text-sm text-muted-foreground">
                                Loading closed orders
                              </div>
                            ) : closeOrdersData.length > 0 ? (
                              closeOrdersData.map((order) => (
                                <div
                                  key={order.id}
                                  className="grid grid-cols-[1fr_0.65fr_0.65fr_1fr_1fr_1fr_1fr_1.25fr_1.25fr_0.8fr_0.9fr] gap-3 px-3 py-2 text-sm hover:bg-accent/30"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500" />
                                    <span className="truncate font-medium">
                                      {order.symbol}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`size-2 rounded-full ${
                                        order.type === "Buy"
                                          ? "bg-emerald-500"
                                          : "bg-red-500"
                                      }`}
                                    />
                                    {order.type}
                                  </div>
                                  <div className="font-mono">
                                    {formatNumber(order.volume)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.openPrice)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.closePrice)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.takeProfit)}
                                  </div>
                                  <div className="font-mono">
                                    {formatMarketPrice(order.stopLoss)}
                                  </div>
                                  <div className="truncate font-mono text-xs">
                                    {new Date(order.openTime).toLocaleString()}
                                  </div>
                                  <div className="truncate font-mono text-xs">
                                    {new Date(order.closeTime).toLocaleString()}
                                  </div>
                                  <div
                                    className={`font-mono ${
                                      order.pnl >= 0
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {order.pnl >= 0 ? "+" : ""}
                                    {formatCurrency(order.pnl)}
                                  </div>
                                  <div>
                                    <Badge variant="secondary" className="text-xs">
                                      {order.closeReason?.replace("_", " ") || order.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-6 text-center text-sm text-muted-foreground">
                                No closed orders
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </section>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-t bg-slate-950 px-4 py-2 font-mono text-xs text-slate-100 shadow-[0_-1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-slate-400">Equity:</span>
              <span className="font-semibold">{formatCurrency(accountEquity)}</span>
              <span className="text-slate-400">USD</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-slate-400">Free Margin:</span>
              <span
                className={`font-semibold ${
                  (accountFreeMargin ?? 0) >= 0 ? "text-slate-100" : "text-red-300"
                }`}
              >
                {formatCurrency(accountFreeMargin)}
              </span>
              <span className="text-slate-400">USD</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-slate-400">Balance:</span>
              <span className="font-semibold">{formatCurrency(accountBalance)}</span>
              <span className="text-slate-400">USD</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-slate-400">Margin:</span>
              <span className="font-semibold">{formatCurrency(reservedMargin)}</span>
              <span className="text-slate-400">USD</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-slate-400">Margin level:</span>
              <span
                className={`font-semibold ${
                  accountMarginLevel !== null && accountMarginLevel < 100
                    ? "text-red-300"
                    : "text-slate-100"
                }`}
              >
                {formatPercent(accountMarginLevel)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
