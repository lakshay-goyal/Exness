import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileSessionResponse } from "@/lib/mobile-auth-api";
import {
  BackendClosedTrade,
  BackendOpenTrade,
  closeTrade,
  fetchTradingProfileData,
} from "@/lib/trading-api";
import { BACKEND_URL } from "@/lib/auth-client";

type HelloWorldScreenProps = {
  onLogout: () => void;
  user: MobileSessionResponse["user"] | null;
};

type DashboardTab = "wallet" | "trade" | "profile";
type IconName =
  | "apps"
  | "arrowDown"
  | "arrowUp"
  | "buy"
  | "check"
  | "clock"
  | "compass"
  | "expand"
  | "home"
  | "profile"
  | "search"
  | "swap";

type DashboardData = {
  balance: number | null;
  openTrades: BackendOpenTrade[];
  closedTrades: BackendClosedTrade[];
};

type LiveMarketPrice = {
  symbol: string;
  marketPrice: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  lastUpdated: number;
};

type SelectedTrade =
  | { status: "open"; orderId: string }
  | { status: "closed"; orderId: string };

const emptyDashboardData: DashboardData = {
  balance: null,
  openTrades: [],
  closedTrades: [],
};

const getWebSocketUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  try {
    const backendUrl = new URL(BACKEND_URL);
    const protocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${backendUrl.hostname}:7070`;
  } catch {
    return "ws://localhost:7070";
  }
};

const normalizeMarketPrice = (value?: number | null) => {
  if (value === null || value === undefined) return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;

  return numericValue > 10_000_000 ? numericValue / 100_000_000 : numericValue;
};

const getMarketCode = (symbol: string) => {
  const symbolUpper = symbol.toUpperCase();
  if (symbolUpper.includes("BTC")) return "BTC";
  if (symbolUpper.includes("ETH")) return "ETH";
  if (symbolUpper.includes("SOL")) return "SOL";
  return symbolUpper.replace(/[^A-Z0-9]/g, "");
};

const getMarketName = (symbol: string) => {
  const marketCode = getMarketCode(symbol);

  if (marketCode === "BTC") return "Bitcoin";
  if (marketCode === "ETH") return "Ethereum";
  if (marketCode === "SOL") return "Solana";

  return marketCode;
};

const getLiveAssetCandidates = (symbol: string) => {
  const marketCode = getMarketCode(symbol);
  return [
    symbol.toUpperCase(),
    `${marketCode}_USDC_PERP`,
    `${marketCode}_USDT_PERP`,
    `${marketCode}USDT`,
    `${marketCode}USD`,
    marketCode,
  ];
};

const findLivePriceForTrade = (
  trade: BackendOpenTrade,
  livePrices: Record<string, LiveMarketPrice>,
) => {
  const candidates = getLiveAssetCandidates(trade.symbol);
  return candidates.map((candidate) => livePrices[candidate]).find(Boolean);
};

const formatCurrency = (value?: number | null, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

const getPriceDigits = (value: number) => {
  if (value >= 100) return 2;
  if (value >= 1) return 4;
  return 6;
};

const formatSignedCurrency = (value: number) => {
  const formatted = formatCurrency(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

const formatPercent = (value: number) => {
  const formatted = Math.abs(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return "0.00%";
};

const formatDate = (value?: string) => {
  if (!value) return "Unavailable";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDateTime = (value?: string) => {
  if (!value) return "Unavailable";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatCloseReason = (value?: string | null) => {
  if (!value) return "Manual";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getTradePnl = (trade: BackendOpenTrade) => {
  const openPrice = normalizeMarketPrice(trade.openPrice) ?? 0;
  const currentPrice = normalizeMarketPrice(trade.currentPrice) ?? openPrice;

  return trade.type === "buy"
    ? (currentPrice - openPrice) * trade.quantity
    : (openPrice - currentPrice) * trade.quantity;
};

const getTradeMargin = (trade: BackendOpenTrade) => {
  const openPrice = normalizeMarketPrice(trade.openPrice) ?? 0;
  const leverage = Number(trade.leverage) > 0 ? Number(trade.leverage) : 1;
  return (trade.quantity * openPrice) / leverage;
};

function Icon({
  color = "#A594F7",
  name,
  size = 28,
}: {
  color?: string;
  name: IconName;
  size?: number;
}) {
  const strokeProps = {
    fill: "none",
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.4,
  };

  if (name === "home") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M5 13L14 5L23 13V24H17V17H11V24H5V13Z" fill={color} />
      </Svg>
    );
  }

  if (name === "apps") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Rect x="5" y="5" width="6" height="6" rx="1.2" {...strokeProps} />
        <Rect x="17" y="5" width="6" height="6" rx="1.2" {...strokeProps} />
        <Rect x="5" y="17" width="6" height="6" rx="1.2" {...strokeProps} />
        <Rect x="17" y="17" width="6" height="6" rx="1.2" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "swap") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M8 9H22L18 5" {...strokeProps} />
        <Path d="M20 19H6L10 23" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "clock") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Circle cx="14" cy="14" r="9" {...strokeProps} />
        <Path d="M14 8V14L18 17" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "compass") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Circle cx="14" cy="14" r="9" {...strokeProps} />
        <Path
          d="M18.5 9.5L15.8 16L9.5 18.5L12.2 12L18.5 9.5Z"
          {...strokeProps}
        />
      </Svg>
    );
  }

  if (name === "profile") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Circle cx="14" cy="10" r="4" {...strokeProps} />
        <Path
          d="M6.5 23C7.6 18.7 10.1 17 14 17C17.9 17 20.4 18.7 21.5 23"
          {...strokeProps}
        />
      </Svg>
    );
  }

  if (name === "expand") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M6 11V6H11" {...strokeProps} />
        <Path d="M22 11V6H17" {...strokeProps} />
        <Path d="M6 17V22H11" {...strokeProps} />
        <Path d="M22 17V22H17" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "search") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Circle cx="12.5" cy="12.5" r="7.5" {...strokeProps} />
        <Path d="M18 18L23 23" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "arrowUp") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M6 18L22 6" {...strokeProps} />
        <Path d="M10 6H22V18" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "arrowDown") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M22 10L6 22" {...strokeProps} />
        <Path d="M18 22H6V10" {...strokeProps} />
      </Svg>
    );
  }

  if (name === "buy") {
    return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Path d="M14 4V24" {...strokeProps} />
        <Path
          d="M19 8.5C18 6.6 16.1 6 14 6C10.8 6 9 7.4 9 9.8C9 14.2 19.5 12.2 19.5 18C19.5 20.4 17.4 22 14 22C11.2 22 9.1 21.1 8 19.2"
          {...strokeProps}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Path d="M6 14L12 20L22 8" {...strokeProps} />
    </Svg>
  );
}

function ScreenShell({
  activeTab,
  children,
  onTabChange,
}: {
  activeTab: DashboardTab;
  children: ReactNode;
  onTabChange: (tab: DashboardTab) => void;
}) {
  return (
    <View className="flex-1 bg-[#171918]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1">
          {children}
          <BottomTabs activeTab={activeTab} onTabChange={onTabChange} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function BottomTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const tabs: { icon: IconName; label: string; tab: DashboardTab }[] = [
    { icon: "home", label: "Wallet", tab: "wallet" },
    { icon: "swap", label: "Trade", tab: "trade" },
    { icon: "profile", label: "Profile", tab: "profile" },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 border-t border-[#2B2E2C] bg-[#1C1D1E]/95 px-7 pb-3 pt-3">
      <View className="flex-row items-center justify-between">
        {tabs.map(({ icon, label, tab }) => {
          const isActive = activeTab === tab;

          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="min-h-[54px] min-w-[80px] items-center justify-center gap-1 active:opacity-70"
              onPress={() => onTabChange(tab)}
            >
              <Icon
                color={isActive ? "#A594F7" : "#858585"}
                name={icon}
                size={27}
              />
              <Text
                className={`text-[11px] font-extrabold tracking-normal ${isActive ? "text-[#A594F7]" : "text-[#8B8B8B]"
                  }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Avatar({ user }: { user: MobileSessionResponse["user"] | null }) {
  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) {
      return "EX";
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  if (user?.image) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        className="h-[36px] w-[36px] rounded-full bg-[#303231]"
        source={{ uri: user.image }}
      />
    );
  }

  return (
    <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-[#303231]">
      <Text className="text-[18px] font-black text-[#A594F7]">{initials}</Text>
    </View>
  );
}

function Header({
  user,
}: {
  accountName?: string;
  user: MobileSessionResponse["user"] | null;
}) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-3">
      <View className="flex-row justify-center items-center gap-3">
        <Avatar user={user} />
        <View>
          <Text
            numberOfLines={1}
            className="max-w-[210px] text-[15px] font-black text-[#8D9290] text-center"
          >
            @
            {user?.name?.replace(/\s+/g, "").toLowerCase() || "alexsmithmobbin"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ActionButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <Pressable className="h-[76px] flex-1 items-center justify-center rounded-[18px] bg-[#2C2E2E] active:opacity-75">
      <Icon color="#A594F7" name={icon} size={30} />
      <Text className="mt-1.5 text-[13px] font-black text-[#9B9B9B]">
        {label}
      </Text>
    </Pressable>
  );
}

function MarketLogo({ symbol }: { symbol: string }) {
  const marketCode = getMarketCode(symbol);

  if (marketCode === "ETH") {
    return (
      <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#F2F2F2]">
        <Svg width={35} height={35} viewBox="0 0 32 32">
          <Path d="M16 3L7 17L16 13L25 17L16 3Z" fill="#5A5A5A" />
          <Path d="M7 18.8L16 29L25 18.8L16 23L7 18.8Z" fill="#303030" />
          <Path d="M16 13L7 17L16 21.4L25 17L16 13Z" fill="#111111" />
        </Svg>
      </View>
    );
  }

  if (marketCode === "BTC") {
    return (
      <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#F7931A]">
        <Text className="text-[31px] font-black text-white">B</Text>
      </View>
    );
  }

  if (marketCode === "SOL") {
    return (
      <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-black">
        <View className="h-2 w-9 -skew-x-12 rounded-full bg-[#00FFA3]" />
        <View className="my-1.5 h-2 w-9 -skew-x-12 rounded-full bg-[#64D7FF]" />
        <View className="h-2 w-9 -skew-x-12 rounded-full bg-[#A855F7]" />
      </View>
    );
  }

  return (
    <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#343837]">
      <Text className="text-[22px] font-black text-white">
        {marketCode.charAt(0)}
      </Text>
    </View>
  );
}

function LiveCryptoRow({ market }: { market: LiveMarketPrice }) {
  const isUp = market.change >= 0;
  const priceDigits = getPriceDigits(market.marketPrice);
  const spread = Math.max(market.ask - market.bid, 0);

  return (
    <View className="rounded-[18px] bg-[#292C2B] px-4 py-4">
      <View className="flex-row items-center">
        <MarketLogo symbol={market.symbol} />
        <View className="ml-4 flex-1">
          <Text className="text-[18px] font-black text-white">
            {getMarketName(market.symbol)}
          </Text>
          <Text className="mt-1 text-[13px] font-bold text-[#9A9A9A]">
            {market.symbol}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[18px] font-black text-white">
            {formatCurrency(market.marketPrice, priceDigits)}
          </Text>
          <Text
            className={`mt-1 text-[14px] font-black ${isUp ? "text-[#28E978]" : "text-[#FF5366]"
              }`}
          >
            {`${formatSignedCurrency(market.change)} (${formatPercent(market.changePercent)})`}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-[14px] bg-[#222524] px-3 py-3">
          <Text className="text-[11px] font-extrabold uppercase text-[#858585]">
            Bid
          </Text>
          <Text className="mt-1 text-[14px] font-black text-white">
            {formatCurrency(market.bid, priceDigits)}
          </Text>
        </View>
        <View className="flex-1 rounded-[14px] bg-[#222524] px-3 py-3">
          <Text className="text-[11px] font-extrabold uppercase text-[#858585]">
            Ask
          </Text>
          <Text className="mt-1 text-[14px] font-black text-white">
            {formatCurrency(market.ask, priceDigits)}
          </Text>
        </View>
        <View className="flex-1 rounded-[14px] bg-[#222524] px-3 py-3">
          <Text className="text-[11px] font-extrabold uppercase text-[#858585]">
            Spread
          </Text>
          <Text className="mt-1 text-[14px] font-black text-white">
            {formatCurrency(spread, priceDigits)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "up" | "down";
  value: string;
}) {
  const valueClass =
    tone === "up"
      ? "text-[#28E978]"
      : tone === "down"
        ? "text-[#FF5366]"
        : "text-white";

  return (
    <View className="min-h-[70px] flex-1 rounded-[16px] bg-[#292C2B] px-4 py-4">
      <Text className="text-[12px] font-extrabold uppercase text-[#8D9290]">
        {label}
      </Text>
      <Text className={`mt-2 text-[17px] font-black ${valueClass}`}>
        {value}
      </Text>
    </View>
  );
}

function WalletTab({
  data,
  isRefreshing,
  livePrices,
  onRefresh,
  user,
}: {
  data: DashboardData;
  isRefreshing: boolean;
  livePrices: Record<string, LiveMarketPrice>;
  onRefresh: () => void;
  user: MobileSessionResponse["user"] | null;
}) {
  const openPnl = data.openTrades.reduce(
    (total, trade) => total + getTradePnl(trade),
    0,
  );
  const reservedMargin = data.openTrades.reduce(
    (total, trade) => total + getTradeMargin(trade),
    0,
  );
  const closedPnl = data.closedTrades.reduce(
    (total, trade) => total + Number(trade.profitLoss || 0),
    0,
  );
  const accountBalance = data.balance;
  const accountEquity =
    accountBalance === null ? null : accountBalance + reservedMargin + openPnl;
  const accountStats = [
    { label: "Available", value: formatCurrency(accountBalance) },
    { label: "Reserved", value: formatCurrency(reservedMargin) },
    {
      label: "Open P/L",
      value: formatSignedCurrency(openPnl),
      tone: openPnl >= 0 ? "up" : "down",
    },
    {
      label: "Closed P/L",
      value: formatSignedCurrency(closedPnl),
      tone: closedPnl >= 0 ? "up" : "down",
    },
  ] as const;
  const openPct =
    accountBalance && accountBalance > 0 ? (openPnl / accountBalance) * 100 : 0;
  const liveCryptoMarkets = Object.values(livePrices).sort((a, b) =>
    getMarketCode(a.symbol).localeCompare(getMarketCode(b.symbol)),
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-28"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-[#173120] pb-6">
        <Header user={user} />
        <View className="items-center px-6 pt-8">
          <Text className="text-[48px] font-black leading-[54px] tracking-normal text-white">
            {formatCurrency(accountEquity)}
          </Text>
          <View className="mt-1 flex-row items-center gap-3">
            <Text
              className={`text-[18px] font-black ${openPnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
                }`}
            >
              {formatSignedCurrency(openPnl)}
            </Text>
            <View className="rounded-lg bg-[#255F3C] px-3 py-1">
              <Text
                className={`text-[16px] font-black ${openPnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
                  }`}
              >
                {formatPercent(openPct)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3 pt-12 px-6">
          {accountStats.map((stat) => (
            <View key={stat.label} className="w-[36%] flex-1 basis-[47%]">
              <InfoCard {...stat} />
            </View>
          ))}
        </View>
      </View>

      <View className="px-6 pt-6">


        <View className="mt-8 flex-row items-center justify-between">
          <Text className="text-[21px] font-black text-white">
            Live crypto values
          </Text>
        </View>

        <View className="mt-4 gap-4">
          {liveCryptoMarkets.length === 0 ? (
            <View className="min-h-[110px] items-center justify-center rounded-[18px] bg-[#292C2B] px-5 py-5">
              <ActivityIndicator color="#A594F7" />
              <Text className="mt-3 text-center text-[14px] font-bold text-[#9A9A9A]">
                Waiting for live crypto prices
              </Text>
            </View>
          ) : (
            liveCryptoMarkets.map((market) => (
              <LiveCryptoRow key={market.symbol} market={market} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function TradeCard({
  isClosing,
  onClose,
  onPress,
  trade,
}: {
  isClosing: boolean;
  onClose: () => void;
  onPress: () => void;
  trade: BackendOpenTrade;
}) {
  const openPrice = normalizeMarketPrice(trade.openPrice) ?? 0;
  const currentPrice = normalizeMarketPrice(trade.currentPrice) ?? openPrice;
  const bidPrice = normalizeMarketPrice(trade.bidPrice);
  const askPrice = normalizeMarketPrice(trade.askPrice);
  const marketPrice = normalizeMarketPrice(trade.marketPrice) ?? currentPrice;
  const pnl = getTradePnl(trade);
  const pnlPct = openPrice > 0 ? (pnl / (openPrice * trade.quantity)) * 100 : 0;
  const side = trade.type === "buy" ? "Buy" : "Sell";
  const symbol = `${trade.symbol.toUpperCase()}/USD`;

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-[22px] bg-[#292C2B] px-5 py-5 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-[20px] font-black text-white">{symbol}</Text>
            <View className="rounded-full bg-[#235638] px-3 py-1">
              <Text className="text-[12px] font-black text-[#28E978]">
                {side}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-[14px] font-bold text-[#9A9A9A]">
            {trade.quantity} {trade.symbol.toUpperCase()} |{" "}
            {Number(trade.leverage) || 1}x
          </Text>
        </View>
        <View className="items-end">
          <Text
            className={`text-[20px] font-black ${pnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
              }`}
          >
            {formatSignedCurrency(pnl)}
          </Text>
          <Text
            className={`mt-1 text-[14px] font-black ${pnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
              }`}
          >
            {formatPercent(pnlPct)}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-3 h-9 items-center justify-center rounded-full bg-[#4A242B] px-4 active:opacity-75"
            disabled={isClosing}
            onPress={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <Text className="text-[12px] font-black text-[#FF8C99]">
              {isClosing ? "Closing..." : "Close"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-5 h-px bg-[#3A3E3C]" />

      <View className="mt-5 flex-row justify-between">
        <TradeMetric label="Entry" value={formatCurrency(openPrice)} />
        <TradeMetric label="Trade" value={formatCurrency(marketPrice)} />
        <TradeMetric
          alignRight
          label="Margin"
          value={formatCurrency(getTradeMargin(trade))}
        />
      </View>

      <View className="mt-4 flex-row justify-between rounded-[14px] bg-[#222524] px-3 py-3">
        <TradeMetric label="Bid" value={formatCurrency(bidPrice)} />
        <TradeMetric alignRight label="Ask" value={formatCurrency(askPrice)} />
      </View>
    </Pressable>
  );
}

function ClosedTradeCard({
  onPress,
  trade,
}: {
  onPress: () => void;
  trade: BackendClosedTrade;
}) {
  const pnl = Number(trade.profitLoss || 0);
  const isPositive = pnl >= 0;
  const symbol = `${trade.symbol.toUpperCase()}/USD`;

  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-[22px] bg-[#292C2B] px-5 py-5 active:opacity-80"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[20px] font-black text-white">{symbol}</Text>
            <View className="rounded-full bg-[#343635] px-3 py-1">
              <Text className="text-[12px] font-black text-[#BDBDBD]">
                {trade.type === "buy" ? "Buy" : "Sell"}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-[14px] font-bold text-[#9A9A9A]">
            {trade.quantity} {trade.symbol.toUpperCase()} |{" "}
            {formatDate(trade.closeTime)}
          </Text>
        </View>
        <Text
          className={`text-[20px] font-black ${isPositive ? "text-[#28E978]" : "text-[#FF5366]"
            }`}
        >
          {formatSignedCurrency(pnl)}
        </Text>
      </View>

      <View className="mt-5 h-px bg-[#3A3E3C]" />

      <View className="mt-5 flex-row justify-between">
        <TradeMetric
          label="Entry"
          value={formatCurrency(normalizeMarketPrice(trade.openPrice))}
        />
        <TradeMetric
          alignRight
          label="Exit"
          value={formatCurrency(normalizeMarketPrice(trade.closePrice))}
        />
      </View>
    </Pressable>
  );
}

function TradeMetric({
  alignRight,
  label,
  value,
}: {
  alignRight?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View className={alignRight ? "items-end" : undefined}>
      <Text className="text-[12px] font-extrabold uppercase text-[#858585]">
        {label}
      </Text>
      <Text className="mt-1 text-[16px] font-black text-white">{value}</Text>
    </View>
  );
}

function DetailRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "up" | "down";
  value: string;
}) {
  const valueClass =
    tone === "up"
      ? "text-[#28E978]"
      : tone === "down"
        ? "text-[#FF5366]"
        : "text-white";

  return (
    <View className="border-b border-[#383B39] py-3">
      <Text className="text-[12px] font-extrabold uppercase text-[#858585]">
        {label}
      </Text>
      <Text className={`mt-1 text-[16px] font-black ${valueClass}`}>
        {value}
      </Text>
    </View>
  );
}

function TradeDetailsModal({
  isClosing,
  onCloseTrade,
  onDismiss,
  selectedTrade,
}: {
  isClosing: boolean;
  onCloseTrade: (orderId: string) => void;
  onDismiss: () => void;
  selectedTrade:
  | { status: "open"; trade: BackendOpenTrade }
  | { status: "closed"; trade: BackendClosedTrade }
  | null;
}) {
  if (!selectedTrade) return null;

  const { status, trade } = selectedTrade;
  const isOpen = status === "open";
  const openPrice = normalizeMarketPrice(trade.openPrice) ?? 0;
  const leverage = Number(trade.leverage) > 0 ? Number(trade.leverage) : 1;
  const margin = (trade.quantity * openPrice) / leverage;
  const side = trade.type === "buy" ? "Buy" : "Sell";
  const symbol = `${trade.symbol.toUpperCase()}/USD`;
  const slippage = trade.slippage ?? trade.stippage ?? null;
  const pnl = isOpen
    ? getTradePnl(trade)
    : Number((trade as BackendClosedTrade).profitLoss || 0);
  const currentOrClosePrice = isOpen
    ? normalizeMarketPrice(trade.currentPrice) ?? openPrice
    : normalizeMarketPrice((trade as BackendClosedTrade).closePrice) ?? 0;

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onDismiss}>
      <View className="flex-1 justify-end bg-black/65">
        <Pressable className="flex-1" onPress={onDismiss} />
        <View className="max-h-[84%] rounded-t-[28px] bg-[#1F2221] px-6 pb-8 pt-5">
          <View className="mb-4 h-1.5 w-14 self-center rounded-full bg-[#444846]" />
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[24px] font-black text-white">
                  {symbol}
                </Text>
                <View
                  className={`rounded-full px-3 py-1 ${isOpen ? "bg-[#235638]" : "bg-[#343635]"
                    }`}
                >
                  <Text
                    className={`text-[12px] font-black ${isOpen ? "text-[#28E978]" : "text-[#BDBDBD]"
                      }`}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-[14px] font-bold text-[#9A9A9A]">
                {side} | {trade.quantity} {trade.symbol.toUpperCase()} |{" "}
                {leverage}x
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#292C2B]"
              onPress={onDismiss}
            >
              <Text className="text-[18px] font-black text-white">x</Text>
            </Pressable>
          </View>

          <View className="mt-5 flex-row gap-3">
            <InfoCard
              label={isOpen ? "Floating P/L" : "Realized P/L"}
              tone={pnl >= 0 ? "up" : "down"}
              value={formatSignedCurrency(pnl)}
            />
            <InfoCard
              label={isOpen ? "Trade Price" : "Close Price"}
              value={formatCurrency(currentOrClosePrice)}
            />
          </View>

          <ScrollView className="mt-5" showsVerticalScrollIndicator={false}>
            <View className="rounded-[20px] bg-[#292C2B] px-5">
              <DetailRow label="Order ID" value={trade.orderId} />
              <DetailRow label="Side" value={side} />
              <DetailRow label="Open price" value={formatCurrency(openPrice)} />
              {isOpen ? (
                <>
                  <DetailRow
                    label="Current price"
                    value={formatCurrency(normalizeMarketPrice(trade.currentPrice))}
                  />
                  <DetailRow
                    label="Market price"
                    value={formatCurrency(normalizeMarketPrice(trade.marketPrice))}
                  />
                  <DetailRow
                    label="Bid"
                    value={formatCurrency(normalizeMarketPrice(trade.bidPrice))}
                  />
                  <DetailRow
                    label="Ask"
                    value={formatCurrency(normalizeMarketPrice(trade.askPrice))}
                  />
                </>
              ) : (
                <>
                  <DetailRow
                    label="Close price"
                    value={formatCurrency(
                      normalizeMarketPrice((trade as BackendClosedTrade).closePrice),
                    )}
                  />
                  <DetailRow
                    label="Closed by"
                    value={formatCloseReason(
                      (trade as BackendClosedTrade).closeReason,
                    )}
                  />
                </>
              )}
              <DetailRow
                label="Take profit"
                value={formatCurrency(normalizeMarketPrice(trade.takeProfit))}
              />
              <DetailRow
                label="Stop loss"
                value={formatCurrency(normalizeMarketPrice(trade.stopLoss))}
              />
              <DetailRow
                label="Slippage"
                value={slippage === null ? "--" : `${slippage}%`}
              />
              <DetailRow label="Margin" value={formatCurrency(margin)} />
              <DetailRow
                label="Open time"
                value={formatDateTime(trade.openTime)}
              />
              {!isOpen ? (
                <DetailRow
                  label="Close time"
                  value={formatDateTime((trade as BackendClosedTrade).closeTime)}
                />
              ) : null}
            </View>

            {isOpen ? (
              <Pressable
                accessibilityRole="button"
                className="mt-5 h-14 items-center justify-center rounded-[18px] bg-[#4A242B] active:opacity-75"
                disabled={isClosing}
                onPress={() => onCloseTrade(trade.orderId)}
              >
                <Text className="text-[15px] font-black text-[#FF8C99]">
                  {isClosing ? "Closing trade..." : "Close trade"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TradesTab({
  data,
  isClosingTrade,
  isRefreshing,
  onCloseTrade,
  onRefresh,
}: {
  data: DashboardData;
  isClosingTrade: boolean;
  isRefreshing: boolean;
  onCloseTrade: (orderId: string) => void;
  onRefresh: () => void;
}) {
  const [kind, setKind] = useState<"open" | "closed">("open");
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade | null>(
    null,
  );
  const isOpen = kind === "open";
  const openPnl = data.openTrades.reduce(
    (total, trade) => total + getTradePnl(trade),
    0,
  );
  const closedPnl = data.closedTrades.reduce(
    (total, trade) => total + Number(trade.profitLoss || 0),
    0,
  );
  const visibleTrades = isOpen ? data.openTrades : data.closedTrades;
  const selectedTradeDetails = useMemo(() => {
    if (!selectedTrade) return null;

    if (selectedTrade.status === "open") {
      const trade = data.openTrades.find(
        (item) => item.orderId === selectedTrade.orderId,
      );
      return trade ? { status: "open" as const, trade } : null;
    }

    const trade = data.closedTrades.find(
      (item) => item.orderId === selectedTrade.orderId,
    );
    return trade ? { status: "closed" as const, trade } : null;
  }, [data.closedTrades, data.openTrades, selectedTrade]);

  const closeSelectedTrade = useCallback(
    (orderId: string) => {
      onCloseTrade(orderId);
      setSelectedTrade(null);
    },
    [onCloseTrade],
  );

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-28 pt-5"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[28px] font-black text-white">Trade</Text>
            <Text className="mt-2 text-[16px] font-bold text-[#9A9A9A]">
              {isOpen
                ? "Positions currently live in the market."
                : "Completed positions and realized returns."}
            </Text>
          </View>
          <View className="h-[54px] w-[54px] items-center justify-center rounded-full bg-[#292C2B]">
            <Icon color="#A594F7" name={isOpen ? "swap" : "check"} size={31} />
          </View>
        </View>

        <View className="mt-7 flex-row rounded-[18px] bg-[#292C2B] p-1.5">
          <Pressable
            className={`h-11 flex-1 items-center justify-center rounded-[14px] ${isOpen ? "bg-[#A594F7]" : ""
              }`}
            onPress={() => setKind("open")}
          >
            <Text
              className={`text-[15px] font-black ${isOpen ? "text-[#151515]" : "text-[#9A9A9A]"
                }`}
            >
              Open
            </Text>
          </Pressable>
          <Pressable
            className={`h-11 flex-1 items-center justify-center rounded-[14px] ${!isOpen ? "bg-[#A594F7]" : ""
              }`}
            onPress={() => setKind("closed")}
          >
            <Text
              className={`text-[15px] font-black ${!isOpen ? "text-[#151515]" : "text-[#9A9A9A]"
                }`}
            >
              Closed
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-row gap-3">
          <InfoCard
            label={isOpen ? "Open Value" : "Realized"}
            tone={(isOpen ? openPnl : closedPnl) >= 0 ? "up" : "down"}
            value={
              isOpen
                ? formatSignedCurrency(openPnl)
                : formatSignedCurrency(closedPnl)
            }
          />
          <InfoCard
            label={isOpen ? "Open Count" : "Closed Count"}
            tone="up"
            value={`${visibleTrades.length}`}
          />
        </View>

        <View className="mt-6 gap-4">
          {visibleTrades.length === 0 ? (
            <View className="rounded-[18px] bg-[#292C2B] px-5 py-8">
              <Text className="text-center text-[15px] font-bold text-[#9A9A9A]">
                {isOpen ? "No open trades." : "No closed trades."}
              </Text>
            </View>
          ) : isOpen ? (
            data.openTrades.map((trade) => (
              <TradeCard
                key={trade.orderId}
                isClosing={isClosingTrade}
                onClose={() => onCloseTrade(trade.orderId)}
                onPress={() =>
                  setSelectedTrade({
                    status: "open",
                    orderId: trade.orderId,
                  })
                }
                trade={trade}
              />
            ))
          ) : (
            data.closedTrades.map((trade) => (
              <ClosedTradeCard
                key={trade.orderId}
                onPress={() =>
                  setSelectedTrade({
                    status: "closed",
                    orderId: trade.orderId,
                  })
                }
                trade={trade}
              />
            ))
          )}
        </View>
      </ScrollView>

      <TradeDetailsModal
        isClosing={isClosingTrade}
        onCloseTrade={closeSelectedTrade}
        onDismiss={() => setSelectedTrade(null)}
        selectedTrade={selectedTradeDetails}
      />
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-b border-[#383B39] py-4">
      <Text className="text-[13px] font-extrabold uppercase text-[#858585]">
        {label}
      </Text>
      <Text className="mt-2 text-[17px] font-black text-white">{value}</Text>
    </View>
  );
}

function ProfileTab({
  data,
  errorMessage,
  isLoading,
  isRefreshing,
  onLogout,
  onRefresh,
  user,
}: {
  data: DashboardData;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onLogout: () => void;
  onRefresh: () => void;
  user: MobileSessionResponse["user"] | null;
}) {
  const openPnl = data.openTrades.reduce(
    (total, trade) => total + getTradePnl(trade),
    0,
  );
  const reservedMargin = data.openTrades.reduce(
    (total, trade) => total + getTradeMargin(trade),
    0,
  );
  const closedPnl = data.closedTrades.reduce(
    (total, trade) => total + Number(trade.profitLoss || 0),
    0,
  );
  const equity =
    data.balance === null ? null : data.balance + reservedMargin + openPnl;

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-28 pt-5"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[28px] font-black text-white">Profile</Text>
      <Text className="mt-2 text-[16px] font-bold text-[#9A9A9A]">
        Account identity, balance, and trades.
      </Text>

      <View className="mt-8 items-center rounded-[24px] bg-[#292C2B] px-5 py-7">
        <Avatar user={user} />
        <Text className="mt-4 text-center text-[25px] font-black text-white">
          {user?.name || "Authenticated user"}
        </Text>
        <Text className="mt-1 text-center text-[16px] font-bold text-[#A0A0A0]">
          {user?.email || "Email unavailable"}
        </Text>
        <View className="mt-5 rounded-full bg-[#235638] px-4 py-2">
          <Text className="text-[13px] font-black text-[#28E978]">
            {user?.hasMobilePin ? "Mobile PIN enabled" : "Mobile PIN not set"}
          </Text>
        </View>
      </View>

      <View className="mt-5 rounded-[22px] bg-[#292C2B] px-5">
        <ProfileRow label="Email" value={user?.email || "Unavailable"} />
        <ProfileRow label="Account Equity" value={formatCurrency(equity)} />
        <ProfileRow
          label="Available Balance"
          value={formatCurrency(data.balance)}
        />
        <ProfileRow
          label="Reserved Margin"
          value={formatCurrency(reservedMargin)}
        />
        <ProfileRow label="Open P/L" value={formatSignedCurrency(openPnl)} />
        <ProfileRow
          label="Closed P/L"
          value={formatSignedCurrency(closedPnl)}
        />
        <ProfileRow label="Open Trades" value={`${data.openTrades.length}`} />
        <View className="py-4">
          <Text className="text-[13px] font-extrabold uppercase text-[#858585]">
            Closed Trades
          </Text>
          <Text className="mt-2 text-[17px] font-black text-white">
            {data.closedTrades.length}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="mt-5 flex-row items-center justify-center gap-2 rounded-[18px] bg-[#292C2B] px-5 py-4">
          <ActivityIndicator color="#A594F7" />
          <Text className="text-[14px] font-bold text-[#9A9A9A]">
            Loading account data
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View className="mt-5 rounded-[18px] bg-[#3A2328] px-5 py-4">
          <Text className="text-[14px] font-bold text-[#FF8C99]">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        className="mt-5 h-[52px] items-center justify-center rounded-[18px] border border-[#5A2D35] bg-[#392126] active:opacity-75"
        onPress={onLogout}
      >
        <Text className="text-[15px] font-black text-[#FF8C99]">Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

export function HelloWorldScreen({ onLogout, user }: HelloWorldScreenProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("wallet");
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [livePrices, setLivePrices] = useState<Record<string, LiveMarketPrice>>(
    {},
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [isClosingTrade, setIsClosingTrade] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const enhancedDashboardData = useMemo<DashboardData>(
    () => ({
      ...dashboardData,
      openTrades: dashboardData.openTrades.map((trade) => {
        const livePrice = findLivePriceForTrade(trade, livePrices);

        if (!livePrice) {
          return trade;
        }

        const currentPrice =
          trade.type === "buy" ? livePrice.bid : livePrice.ask;

        return {
          ...trade,
          currentPrice,
          marketPrice: livePrice.marketPrice,
          bidPrice: livePrice.bid,
          askPrice: livePrice.ask,
        };
      }),
    }),
    [dashboardData, livePrices],
  );
  const loadDashboardData = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshingData(true);
    } else {
      setIsLoadingData(true);
    }

    try {
      const data = await fetchTradingProfileData();
      setDashboardData({
        balance: data.balance,
        openTrades: data.openTrades,
        closedTrades: data.closedTrades,
      });
      setDataError(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "Unable to load account data",
      );
    } finally {
      setIsLoadingData(false);
      setIsRefreshingData(false);
    }
  }, []);
  const refreshDashboardData = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);
  const handleCloseTrade = useCallback(
    async (orderId: string) => {
      if (isClosingTrade) return;

      try {
        setIsClosingTrade(true);
        await closeTrade(orderId);
        await loadDashboardData(true);
      } catch (error) {
        Alert.alert(
          "Unable to close trade",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setIsClosingTrade(false);
      }
    },
    [isClosingTrade, loadDashboardData],
  );

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [loadDashboardData, user]);

  useEffect(() => {
    if (!user) return;

    const socket = new WebSocket(getWebSocketUrl());

    socket.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(String(event.data));
        const data =
          typeof parsedMessage === "string"
            ? JSON.parse(parsedMessage)
            : parsedMessage;

        if (!data.asset || data.bid === undefined || data.ask === undefined) {
          return;
        }

        const bid = normalizeMarketPrice(data.bid);
        const ask = normalizeMarketPrice(data.ask);

        if (bid === null || ask === null) {
          return;
        }

        const marketPrice = (bid + ask) / 2;
        const symbol = String(data.asset).toUpperCase();

        setLivePrices((previousPrices) => {
          const previousPrice = previousPrices[symbol];
          const change = previousPrice
            ? marketPrice - previousPrice.marketPrice
            : 0;
          const changePercent =
            previousPrice && previousPrice.marketPrice !== 0
              ? (change / previousPrice.marketPrice) * 100
              : 0;

          return {
            ...previousPrices,
            [symbol]: {
              symbol,
              bid,
              ask,
              marketPrice,
              change,
              changePercent,
              lastUpdated: Date.now(),
            },
          };
        });
      } catch (error) {
        console.warn("Unable to parse live price update", error);
      }
    };

    socket.onerror = () => {
      console.warn("Mobile price websocket connection failed");
    };

    return () => {
      socket.close();
    };
  }, [user]);

  return (
    <ScreenShell activeTab={activeTab} onTabChange={setActiveTab}>
      <View
        className="flex-1"
        style={{
          maxWidth: Math.min(width, 520),
          width: "100%",
          alignSelf: "center",
        }}
      >
        {activeTab === "wallet" ? (
          <WalletTab
            data={enhancedDashboardData}
            isRefreshing={isRefreshingData}
            livePrices={livePrices}
            onRefresh={refreshDashboardData}
            user={user}
          />
        ) : null}
        {activeTab === "trade" ? (
          <TradesTab
            data={enhancedDashboardData}
            isClosingTrade={isClosingTrade}
            isRefreshing={isRefreshingData}
            onCloseTrade={handleCloseTrade}
            onRefresh={refreshDashboardData}
          />
        ) : null}
        {activeTab === "profile" ? (
          <ProfileTab
            data={enhancedDashboardData}
            errorMessage={dataError}
            isLoading={isLoadingData}
            isRefreshing={isRefreshingData}
            onLogout={onLogout}
            onRefresh={refreshDashboardData}
            user={user}
          />
        ) : null}
      </View>
    </ScreenShell>
  );
}
