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
  openPrice: number;
  currentPrice: number;
  pnl: number;
  status: string;
}

interface BackendOpenOrder {
  orderId: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  openPrice: number;
  currentPrice: number;
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
  pnl: number;
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
  liveUpdatedAt,
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const currentPriceLineRef = useRef<IPriceLine | null>(null);
  const livePriceRef = useRef<number | undefined>(livePrice);
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
    liveUpdatedAtRef.current = liveUpdatedAt;
  }, [livePrice, liveUpdatedAt]);

  const applyLiveTickToChart = useCallback(
    (price?: number, updatedAt?: number) => {
      const series = candlestickSeriesRef.current;
      if (!series || price === undefined || Number.isNaN(price)) return;

      const priceLineColor = "#38bdf8";
      if (currentPriceLineRef.current) {
        currentPriceLineRef.current.applyOptions({
          price,
          title: formatNumber(price, 2),
        });
      } else {
        currentPriceLineRef.current = series.createPriceLine({
          price,
          color: priceLineColor,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: formatNumber(price, 2),
        });
      }

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
    let isDisposed = false;

    const loadData = async () => {
      const candles = await fetchCandles(asset, time);
      if (isDisposed) return;

      if (candles) {
        candlestick.setData(candles);
        lastCandleRef.current = candles.at(-1) ?? null;
        applyLiveTickToChart(livePriceRef.current, liveUpdatedAtRef.current);
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
      chart.remove();
    };
  }, [applyLiveTickToChart, asset, time]);

  useEffect(() => {
    applyLiveTickToChart(livePrice, liveUpdatedAt);
  }, [applyLiveTickToChart, livePrice, liveUpdatedAt]);

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
  const { token, isAuthenticated, balance } = useAuth();

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
  const openActiveOrders = useMemo(
    () => orders.filter((order) => order.status === "open"),
    [orders]
  );
  const orderVolumeNumber = Number.parseFloat(orderVolume) || 0;
  const marginRequired = selectedCrypto
    ? (selectedCrypto.price * orderVolumeNumber) / 100
    : 0;
  const freeMargin = balance !== null ? balance - marginRequired : null;
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
          parsedOrders.map((orderData) => ({
            id: orderData.orderId,
            symbol: orderData.symbol.toUpperCase(),
            type: orderData.type === "buy" ? "Buy" : "Sell",
            volume: orderData.quantity,
            openPrice: orderData.openPrice,
            currentPrice: orderData.currentPrice,
            pnl:
              orderData.type === "buy"
                ? (orderData.currentPrice - orderData.openPrice) *
                  orderData.quantity
                : (orderData.openPrice - orderData.currentPrice) *
                  orderData.quantity,
            status: orderData.status,
          }))
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
            openPrice: orderData.openPrice,
            closePrice: orderData.closePrice,
            openTime: orderData.openTime,
            closeTime: orderData.closeTime,
            pnl: orderData.profitLoss || 0,
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

    const timer = setTimeout(() => {
      fetchOpenOrders();
      fetchCloseOrders();
    }, 100);

    return () => {
      clearTimeout(timer);
      openOrdersControllerRef.current?.abort();
      closeOrdersControllerRef.current?.abort();
    };
  }, [fetchCloseOrders, fetchOpenOrders, isAuthenticated, token]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (!data.asset || !data.bid || !data.ask) return;

        setRealTimeCryptoData((prevData) => {
          const symbol = data.asset;
          const prevAsset = prevData[symbol];
          const bidPrice = Number(data.bid) / 100000000;
          const askPrice = Number(data.ask) / 100000000;
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

    setCreateOrderLoading(true);
    try {
      const response = await axios.post(`${getBackendUrl()}/api/v1/trade/create`, {
        symbol: selectedCrypto.symbol,
        type,
        quantity: orderVolumeNumber,
        leverage: 100,
        slippage: slippage ? Number.parseFloat(slippage) : undefined,
        takeProfit: takeProfit ? Number.parseFloat(takeProfit) : undefined,
        stopLoss: stopLoss ? Number.parseFloat(stopLoss) : undefined,
      });

      if (response.data.message) {
        await fetchOpenOrders();
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
                                          {formatNumber(crypto.bid, 5)} /{" "}
                                          {formatNumber(crypto.ask, 5)}
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
                              Bid {formatNumber(selectedCrypto?.bid, 5)}
                            </span>
                            <span className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                              Ask {formatNumber(selectedCrypto?.ask, 5)}
                            </span>
                            <span className="rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground">
                              Spread {formatNumber(spread, 5)}
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
                                  {formatNumber(selectedCrypto?.bid, 5)}
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
                                  {formatNumber(selectedCrypto?.ask, 5)}
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
                                        (freeMargin ?? 0) >= 0
                                          ? "text-emerald-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {formatCurrency(freeMargin)}
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
                          <div className="min-w-[760px]">
                            <div className="grid grid-cols-[1fr_0.7fr_0.7fr_1fr_1fr_0.8fr_0.6fr] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                              <div>Symbol</div>
                              <div>Type</div>
                              <div>Volume</div>
                              <div>Open Price</div>
                              <div>Current</div>
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
                                  className="grid grid-cols-[1fr_0.7fr_0.7fr_1fr_1fr_0.8fr_0.6fr] gap-3 px-3 py-2 text-sm hover:bg-accent/30"
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
                                    {formatNumber(order.openPrice)}
                                  </div>
                                  <div className="font-mono">
                                    {formatNumber(order.currentPrice)}
                                  </div>
                                  <div
                                    className={`font-mono ${
                                      order.pnl >= 0
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {order.pnl >= 0 ? "+" : ""}
                                    {formatNumber(order.pnl)}
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
                          <div className="min-w-[980px]">
                            <div className="grid grid-cols-[1fr_0.7fr_0.7fr_1fr_1fr_1.4fr_1.4fr_0.8fr_0.8fr] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                              <div>Symbol</div>
                              <div>Type</div>
                              <div>Volume</div>
                              <div>Open Price</div>
                              <div>Close Price</div>
                              <div>Open Time</div>
                              <div>Close Time</div>
                              <div>P/L</div>
                              <div>Status</div>
                            </div>
                            {closedOrdersLoading ? (
                              <div className="p-6 text-center text-sm text-muted-foreground">
                                Loading closed orders
                              </div>
                            ) : closeOrdersData.length > 0 ? (
                              closeOrdersData.map((order) => (
                                <div
                                  key={order.id}
                                  className="grid grid-cols-[1fr_0.7fr_0.7fr_1fr_1fr_1.4fr_1.4fr_0.8fr_0.8fr] gap-3 px-3 py-2 text-sm hover:bg-accent/30"
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
                                    {formatNumber(order.openPrice)}
                                  </div>
                                  <div className="font-mono">
                                    {formatNumber(order.closePrice)}
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
                                    {formatNumber(order.pnl)}
                                  </div>
                                  <div>
                                    <Badge variant="secondary" className="text-xs">
                                      {order.status}
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
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
