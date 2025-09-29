"use client";
import React, { useState, useEffect } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Settings,
  Plus,
  Minus,
  MoreHorizontal,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Mock orders data
const mockOrders = [
  {
    id: 1,
    symbol: "BTC",
    type: "Buy",
    volume: 0.02,
    openPrice: 109035.24,
    currentPrice: 111220,
    pnl: 43.49,
    status: "open",
  },
  {
    id: 2,
    symbol: "XAU/USD",
    type: "Buy",
    volume: 0.01,
    openPrice: 3409.875,
    currentPrice: 3535.4,
    pnl: 125.59,
    status: "open",
  },
];

type CryptoAsset = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  signal: "buy" | "sell";
  bid: number;
  ask: number;
};

const Dashboard = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(
    null
  );
  const [realTimeCryptoData, setRealTimeCryptoData] = useState<
    Record<string, CryptoAsset>
  >({
    BTCUSDT: {
      symbol: "BTCUSDT",
      name: "Bitcoin",
      price: 0,
      change: 0,
      changePercent: 0,
      signal: "buy",
      bid: 0,
      ask: 0,
    },
    ETHUSDT: {
      symbol: "ETHUSDT",
      name: "Ethereum",
      price: 0,
      change: 0,
      changePercent: 0,
      signal: "buy",
      bid: 0,
      ask: 0,
    },
    SOLUSDT: {
      symbol: "SOLUSDT",
      name: "Solana",
      price: 0,
      change: 0,
      changePercent: 0,
      signal: "buy",
      bid: 0,
      ask: 0,
    },
  });
  const [priceData, setPriceData] = useState<any[]>([]);
  const [orderVolume, setOrderVolume] = useState("0.01");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [orders, setOrders] = useState(mockOrders);
  const [activeTab, setActiveTab] = useState("open");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:7070/");

    ws.onopen = () => {
      console.log("WebSocket connection opened");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.asset && data.bid && data.ask) {
        setRealTimeCryptoData((prevData) => {
          const symbol = data.asset;
          const prevAsset = prevData[symbol];

          if (prevAsset) {
            const newPrice = (data.bid + data.ask) / 2;
            const change = newPrice - prevAsset.price;
            const changePercent =
              prevAsset.price === 0 ? 0 : (change / prevAsset.price) * 100;

            const updatedAsset = {
              ...prevAsset,
              price: newPrice,
              bid: Number(data.bid) / 100000000,
              ask: Number(data.ask) / 100000000,
              change: change,
              changePercent: changePercent,
              signal: change > 0 ? "buy" : "sell",
            };

            // Update priceData for the selected crypto
            if (selectedCrypto?.symbol === symbol) {
              setPriceData((prevPriceData) => [
                ...prevPriceData.slice(-99), // Keep last 99 data points
                {
                  time: new Date().toLocaleTimeString(),
                  price: newPrice,
                  volume: Math.random() * 1000 + 500,
                },
              ]);
              // Fix: Ensure 'signal' is typed as 'buy' | 'sell'
              setSelectedCrypto((prev) =>
                prev && prev.symbol === symbol
                  ? {
                      ...prev,
                      price: updatedAsset.price,
                      bid: updatedAsset.bid,
                      ask: updatedAsset.ask,
                      change: updatedAsset.change,
                      changePercent: updatedAsset.changePercent,
                      signal: updatedAsset.signal as "buy" | "sell",
                    }
                  : prev
              );
            }
            return { ...prevData, [symbol]: updatedAsset };
          }
          return prevData;
        });
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [selectedCrypto]); // Reconnect WebSocket if selectedCrypto changes

  // Set initial selected crypto once realTimeCryptoData is populated
  useEffect(() => {
    if (
      !selectedCrypto &&
      Object.keys(realTimeCryptoData).length > 0 &&
      realTimeCryptoData.BTCUSDT
    ) {
      setSelectedCrypto(realTimeCryptoData.BTCUSDT);
    }
  }, [realTimeCryptoData, selectedCrypto]);

  const PriceChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.3}
        />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          domain={["dataMin - 100", "dataMax + 100"]}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value: any) => [`$${value.toFixed(2)}`, "Price"]}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
        />
        <ReferenceLine
          y={selectedCrypto?.price}
          stroke="hsl(var(--destructive))"
          strokeDasharray="2 2"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const handleOrder = (type: "buy" | "sell") => {
    const newOrder = {
      id: orders.length + 1,
      symbol: selectedCrypto?.symbol,
      type: type === "buy" ? "Buy" : "Sell",
      volume: parseFloat(orderVolume),
      openPrice:
        type === "buy"
          ? selectedCrypto?.bid !== undefined
            ? selectedCrypto.bid / 100000000
            : 0
          : selectedCrypto?.ask !== undefined
            ? selectedCrypto.ask / 100000000
            : 0,
      currentPrice: selectedCrypto?.price ?? 0,
      pnl: 0,
      status: "open",
    };
    setOrders([
      ...orders,
      {
        ...newOrder,
        symbol: selectedCrypto?.symbol ?? "",
        openPrice: newOrder.openPrice ?? 0,
        currentPrice: selectedCrypto?.price ?? 0,
      },
    ]);
  };

  return (
    <div className="h-screen bg-background text-foreground font-bricolage flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">CryptoTrade CFD</h1>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Demo
          </Badge>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Balance:{" "}
              <span className="text-foreground font-medium">$10,007.65</span>
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="default" size="sm">
            Deposit
          </Button>
        </div>
      </header>

      {/* Main Dashboard - Fixed Height Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Instruments */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-0"} lg:w-80 transition-all duration-300 overflow-hidden border-r border-border bg-card/30`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">INSTRUMENTS</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-10 h-9" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Favorites</span>
                </div>

                <div className="space-y-1">
                  {Object.values(realTimeCryptoData).map((crypto) => (
                    <Card
                      key={crypto.symbol}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                        selectedCrypto?.symbol === crypto.symbol
                          ? "bg-primary/10 border-primary/30"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setSelectedCrypto(crypto)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span className="font-medium text-sm">
                            {crypto.symbol}
                          </span>
                        </div>
                        <Badge
                          variant={
                            crypto.signal === "buy" ? "default" : "destructive"
                          }
                          className="text-xs px-2 py-0"
                        >
                          {crypto.signal === "buy" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Bid/Ask
                          </span>
                          <span className="text-xs font-mono">
                            {crypto.bid?.toFixed(5)}/{crypto.ask?.toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Chart Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chart Header */}
          <div className="h-14 border-b border-border flex items-center px-4 bg-card/30">
            <div className="flex items-center gap-4 min-w-0">
              <span className="font-semibold truncate">
                {selectedCrypto?.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono">
                  $
                  {selectedCrypto?.price !== undefined
                    ? (selectedCrypto.price / 100000000).toFixed(2)
                    : "--"}
                </span>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    selectedCrypto?.change !== undefined
                      ? selectedCrypto.change > 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {selectedCrypto?.change !== undefined ? (
                    selectedCrypto.change > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )
                  ) : null}
                  {selectedCrypto?.change !== undefined
                    ? `${selectedCrypto.change > 0 ? "+" : ""}${(selectedCrypto.change / 100000000).toFixed(2)}`
                    : "--"}{" "}
                  (
                  {selectedCrypto?.changePercent !== undefined
                    ? `${(selectedCrypto.changePercent / 100000000).toFixed(2)}%`
                    : "--"}
                  )
                </div>
              </div>
            </div>
          </div>

          {/* Chart Content */}
          <div className="flex-1 p-4 min-h-0">
            <Card className="h-full">
              <CardContent className="p-4 h-full">
                <PriceChart data={priceData} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Order Panel */}
        <div
          className={`${rightPanelOpen ? "w-80" : "w-0"} lg:w-80 transition-all duration-300 overflow-hidden border-l border-border bg-card/30`}
        >
          <div className="h-full flex flex-col">
            {/* Order Form Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">TRADING PANEL</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setRightPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Buy/Sell Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  onClick={() => handleOrder("sell")}
                  variant="destructive"
                  className="h-14 flex flex-col"
                >
                  <div className="text-lg font-bold">Sell</div>
                  <div className="text-xs opacity-90">
                    {selectedCrypto?.bid?.toFixed(5)}
                  </div>
                </Button>
                <Button
                  onClick={() => handleOrder("buy")}
                  className="h-14 flex flex-col bg-green-600 hover:bg-green-700"
                >
                  <div className="text-lg font-bold">Buy</div>
                  <div className="text-xs opacity-90">
                    {selectedCrypto?.ask?.toFixed(5)}
                  </div>
                </Button>
              </div>

              <Tabs defaultValue="market" className="mb-4">
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="market" className="text-xs">
                    Market
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">
                    Pending
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Order Parameters */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Volume
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setOrderVolume(
                          Math.max(
                            0.01,
                            parseFloat(orderVolume) - 0.01
                          ).toFixed(2)
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      value={orderVolume}
                      onChange={(e) => setOrderVolume(e.target.value)}
                      className="text-center text-sm h-8"
                    />
                    <span className="text-xs text-muted-foreground min-w-fit">
                      Lots
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setOrderVolume(
                          (parseFloat(orderVolume) + 0.01).toFixed(2)
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Take Profit
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Not set"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Button variant="outline" size="sm">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">
                    Stop Loss
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Not set"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Button variant="outline" size="sm">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Account Info */}
                <Card className="p-3 bg-accent/30">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Margin Required:
                      </span>
                      <span className="font-mono">$1,112.21</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Free Margin:
                      </span>
                      <span className="font-mono text-green-500">
                        $8,895.44
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Margin Level:
                      </span>
                      <span className="font-mono">801.2%</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel - Orders (Collapsible) */}
      <div className="h-48 border-t border-border bg-card/30">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border min-h-[3rem]">
            <TabsList className="h-8">
              <TabsTrigger value="open" className="text-xs">
                Open ({orders.filter((o) => o.status === "open").length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                Pending
              </TabsTrigger>
              <TabsTrigger value="closed" className="text-xs">
                Closed
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                Close all
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="open" className="h-full m-0 p-4">
              <div className="h-full overflow-y-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-7 gap-4 text-xs font-medium text-muted-foreground pb-2 border-b border-border">
                    <div>Symbol</div>
                    <div>Type</div>
                    <div>Volume</div>
                    <div>Open Price</div>
                    <div>Current</div>
                    <div>P/L</div>
                    <div>Action</div>
                  </div>
                  <div className="space-y-2 mt-2">
                    {orders
                      .filter((o) => o.status === "open")
                      .map((order) => (
                        <div
                          key={order.id}
                          className="grid grid-cols-7 gap-4 text-sm py-2 hover:bg-accent/30 rounded-md px-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="font-medium">{order.symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.type === "Buy"
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            {order.type}
                          </div>
                          <div className="font-mono">
                            {order.volume.toFixed(2)}
                          </div>
                          <div className="font-mono">
                            {order.openPrice.toLocaleString()}
                          </div>
                          <div className="font-mono">
                            {order.currentPrice.toLocaleString()}
                          </div>
                          <div
                            className={`font-mono ${order.pnl > 0 ? "text-green-500" : "text-red-500"}`}
                          >
                            {order.pnl > 0 ? "+" : ""}
                            {order.pnl.toFixed(2)}
                          </div>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="h-full m-0 p-4">
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No pending orders
              </div>
            </TabsContent>

            <TabsContent value="closed" className="h-full m-0 p-4">
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No closed orders
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
