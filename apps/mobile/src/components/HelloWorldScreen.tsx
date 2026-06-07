import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Link,
  Stack,
  router,
  useIsFocused,
  useLocalSearchParams,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { cssInterop } from "nativewind";
import { LineChart } from "react-native-gifted-charts";
import { marketSymbolMapper, priceNormalizer } from "@repo/trading-core";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { EaseView, type EaseViewProps } from "react-native-ease";

import { PressableScaleMotion } from "@/components/PressMotion";
import { getKeyboardControllerPackage } from "@/lib/keyboard-controller";
import { MobileSessionResponse } from "@/lib/mobile-auth-api";
import {
  playSubtleTapHaptic,
  playTradeClosedHaptic,
  playTradePlacedHaptic,
} from "@/lib/trade-haptics";
import {
  BackendClosedTrade,
  BackendOpenTrade,
  CandleInterval,
  closeTrade,
  createTrade,
  fetchCandles,
  fetchLatestPrices,
  fetchTradingProfileData,
} from "@/lib/trading-api";
import { BACKEND_URL } from "@/lib/auth-client";

type HelloWorldScreenProps = {
  onLogout: () => void;
  user: MobileSessionResponse["user"] | null;
};

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

type LivePricePayload = {
  asset?: string;
  symbol?: string;
  price?: number | string;
  bid?: number | string;
  ask?: number | string;
};

type DashboardTabsContextValue = {
  data: DashboardData;
  errorMessage: string | null;
  isClosingTrade: boolean;
  isLoadingData: boolean;
  isRefreshingData: boolean;
  livePrices: Record<string, LiveMarketPrice>;
  onCloseTrade: (orderId: string) => Promise<void>;
  onTradeCreated: (orderId?: string) => Promise<void>;
  onLogout: () => void;
  onRefresh: () => Promise<DashboardData | null>;
  user: MobileSessionResponse["user"] | null;
};

type ChartPoint = {
  value: number;
  dataPointText: string;
  date: string;
  label?: string;
  labelTextStyle?: {
    color: string;
    fontSize: number;
    width: number;
  };
};

type SelectedTrade =
  | { status: "open"; orderId: string }
  | { status: "closed"; orderId: string };

type TradeKind = "open" | "closed";

const candleIntervals: { label: string; value: CandleInterval }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];

const emptyDashboardData: DashboardData = {
  balance: null,
  openTrades: [],
  closedTrades: [],
};

const tradeKeyboardToolbarTheme = {
  light: {
    primary: "#151515",
    disabled: "#8F8F8F",
    background: "#F4F4F4",
    ripple: "rgba(0,0,0,0.08)",
  },
  dark: {
    primary: "#FFFFFF",
    disabled: "#777D7A",
    background: "#1C1F1E",
    ripple: "rgba(255,255,255,0.12)",
  },
};

const tabEnterInitial = { opacity: 0, translateY: 10 };
const tabEnterAnimate = { opacity: 1, translateY: 0 };
const tradeTabIndicatorPadding = 6;
const chartIntervalTabIndicatorPadding = 4;
const StyledAnimatedView = cssInterop(Animated.View, {
  className: "style",
});
const requiredCryptoMarketCodes = ["BTC", "ETH", "SOL"] as const;

const hasNativeEaseView = () => {
  if (Platform.OS === "web") {
    return true;
  }

  return Boolean(UIManager.getViewManagerConfig?.("EaseView"));
};

const getWebSocketUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL;

  if (configuredUrl?.toLowerCase() === "disabled") {
    return null;
  }

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

const normalizeMarketPrice = (value?: number | string | null) =>
  priceNormalizer.normalizeStreamPriceValue(value);

const getMarketCode = (symbol: string) => marketSymbolMapper.getMarketCode(symbol);

const getCanonicalLiveAssetSymbol = (symbol: string) =>
  marketSymbolMapper.getCanonicalLiveAssetSymbol(symbol);

const getMarketName = (symbol: string) => marketSymbolMapper.getMarketName(symbol);

const getLiveAssetCandidates = (symbol: string) =>
  marketSymbolMapper.getLiveAssetCandidates(symbol);

const hasAllRequiredCryptoPrices = (
  livePrices: Record<string, LiveMarketPrice>,
) => {
  return requiredCryptoMarketCodes.every((marketCode) =>
    getLiveAssetCandidates(marketCode).some(
      (candidate) => livePrices[candidate],
    ),
  );
};

const mergeLivePricePayloads = (
  previousPrices: Record<string, LiveMarketPrice>,
  payloads: LivePricePayload[],
) => {
  let nextPrices = previousPrices;

  payloads.forEach((payload) => {
    const asset = payload.asset ?? payload.symbol;

    if (!asset || payload.bid === undefined || payload.ask === undefined) {
      return;
    }

    const bid = normalizeMarketPrice(payload.bid);
    const ask = normalizeMarketPrice(payload.ask);

    if (bid === null || ask === null) {
      return;
    }

    const payloadPrice = normalizeMarketPrice(payload.price);
    const marketPrice = payloadPrice ?? (bid + ask) / 2;
    const symbol = getCanonicalLiveAssetSymbol(String(asset));
    const previousPrice = nextPrices[symbol];
    const change = previousPrice ? marketPrice - previousPrice.marketPrice : 0;
    const changePercent =
      previousPrice && previousPrice.marketPrice !== 0
        ? (change / previousPrice.marketPrice) * 100
        : 0;

    if (nextPrices === previousPrices) {
      nextPrices = { ...previousPrices };
    }

    nextPrices[symbol] = {
      symbol,
      bid,
      ask,
      marketPrice,
      change,
      changePercent,
      lastUpdated: Date.now(),
    };
  });

  return nextPrices;
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

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

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

const formatChartDate = (value: string, interval: CandleInterval) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (interval === "1d") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

const DashboardTabsContext = createContext<DashboardTabsContextValue | null>(
  null,
);
const TabFocusAnimationContext = createContext(0);

function useDashboardTabsContext() {
  const context = useContext(DashboardTabsContext);

  if (!context) {
    throw new Error(
      "Dashboard tab screens must be rendered inside DashboardTabsProvider.",
    );
  }

  return context;
}

function useFocusedTabAnimationKey() {
  const isFocused = useIsFocused();
  const wasFocused = useRef(isFocused);
  const [animationKey, setAnimationKey] = useState(() => (isFocused ? 1 : 0));

  useEffect(() => {
    if (isFocused && !wasFocused.current) {
      setAnimationKey((key) => key + 1);
    }

    wasFocused.current = isFocused;
  }, [isFocused]);

  return animationKey;
}

function FocusedTabAnimationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: number;
}) {
  return (
    <TabFocusAnimationContext.Provider value={value}>
      {children}
    </TabFocusAnimationContext.Provider>
  );
}

function DashboardTabFrame({
  children,
  includeTopSafeArea = true,
}: {
  children: ReactNode;
  includeTopSafeArea?: boolean;
}) {
  const { width } = useWindowDimensions();
  const safeAreaEdges = includeTopSafeArea
    ? (["top", "left", "right"] as const)
    : (["left", "right"] as const);

  return (
    <View className="flex-1 bg-[#171918]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={safeAreaEdges}>
        <View
          className="flex-1"
          style={{
            maxWidth: Math.min(width, 520),
            width: "100%",
            alignSelf: "center",
          }}
        >
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

function TabEaseItem({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const focusAnimationKey = useContext(TabFocusAnimationContext);
  const fallbackOpacity = useMemo(() => new Animated.Value(0), []);
  const fallbackTranslateY = useMemo(() => new Animated.Value(10), []);
  const transition = useMemo<EaseViewProps["transition"]>(
    () => ({ type: "timing", duration: 260, easing: "easeIn", delay }),
    [delay],
  );

  useEffect(() => {
    if (hasNativeEaseView()) {
      return;
    }

    fallbackOpacity.setValue(0);
    fallbackTranslateY.setValue(10);

    const animation = Animated.parallel([
      Animated.timing(fallbackOpacity, {
        duration: 260,
        easing: Easing.in(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(fallbackTranslateY, {
        duration: 260,
        easing: Easing.in(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]);
    const timeout = setTimeout(() => {
      animation.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [delay, fallbackOpacity, fallbackTranslateY, focusAnimationKey]);

  if (!hasNativeEaseView()) {
    return (
      <StyledAnimatedView
        className={className}
        style={{
          opacity: fallbackOpacity,
          transform: [{ translateY: fallbackTranslateY }],
        }}
      >
        {children}
      </StyledAnimatedView>
    );
  }

  return (
    <EaseView
      animate={tabEnterAnimate}
      className={className}
      initialAnimate={tabEnterInitial}
      key={`${focusAnimationKey}-${delay}`}
      transition={transition}
    >
      {children}
    </EaseView>
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
    <PressableScaleMotion className="h-[76px] flex-1 items-center justify-center rounded-[18px] bg-[#2C2E2E]">
      <Icon color="#A594F7" name={icon} size={30} />
      <Text className="mt-1.5 text-[13px] font-black text-[#9B9B9B]">
        {label}
      </Text>
    </PressableScaleMotion>
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

function LiveCryptoRow({
  market,
}: {
  market: LiveMarketPrice;
}) {
  const isUp = market.change >= 0;
  const priceDigits = getPriceDigits(market.marketPrice);
  const spread = Math.max(market.ask - market.bid, 0);
  const href = {
    pathname: "/crypto/[symbol]",
    params: { symbol: market.symbol },
  } as const;

  return (
    <Link asChild href={href}>
      <Link.AppleZoom>
        <Pressable
          accessibilityRole="button"
          className="rounded-[18px] bg-[#292C2B] px-4 py-4"
          collapsable={false}
        >
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
                className={`mt-1 text-[14px] font-black ${
                  isUp ? "text-[#28E978]" : "text-[#FF5366]"
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
        </Pressable>
      </Link.AppleZoom>
    </Link>
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

function ChartIntervalTabs({
  selectedInterval,
  onChange,
}: {
  selectedInterval: CandleInterval;
  onChange: (interval: CandleInterval) => void;
}) {
  const [tabsWidth, setTabsWidth] = useState(0);
  const selectedIndex = Math.max(
    candleIntervals.findIndex(
      (interval) => interval.value === selectedInterval,
    ),
    0,
  );
  const maxIndex = candleIntervals.length - 1;
  const indicatorProgress = useRef(new Animated.Value(selectedIndex)).current;
  const indicatorWidth = Math.max(
    (tabsWidth - chartIntervalTabIndicatorPadding * 2) / candleIntervals.length,
    0,
  );
  const indicatorTranslateX = indicatorProgress.interpolate({
    inputRange: [0, maxIndex],
    outputRange: [0, indicatorWidth * maxIndex],
  });
  const indicatorScaleX = indicatorProgress.interpolate({
    inputRange: [0, maxIndex / 2, maxIndex],
    outputRange: [1, 1.045, 1],
  });

  useEffect(() => {
    const animation = Animated.spring(indicatorProgress, {
      damping: 20,
      mass: 0.8,
      stiffness: 190,
      toValue: selectedIndex,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [indicatorProgress, selectedIndex]);

  return (
    <View
      className="mt-4 h-[44px] flex-row overflow-hidden rounded-[14px] bg-[#222524] p-1"
      onLayout={(event) => setTabsWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: "#A594F7",
          borderRadius: 11,
          bottom: chartIntervalTabIndicatorPadding,
          left: chartIntervalTabIndicatorPadding,
          opacity: indicatorWidth > 0 ? 1 : 0,
          position: "absolute",
          top: chartIntervalTabIndicatorPadding,
          transform: [
            { translateX: indicatorTranslateX },
            { scaleX: indicatorScaleX },
          ],
          width: indicatorWidth,
        }}
      />
      {candleIntervals.map((interval) => {
        const isActive = selectedInterval === interval.value;

        return (
          <PressableScaleMotion
            key={interval.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="h-9 flex-1 items-center justify-center rounded-[11px]"
            onPress={() => onChange(interval.value)}
          >
            <Text
              className={`text-[12px] font-black ${
                isActive ? "text-[#151515]" : "text-[#9A9A9A]"
              }`}
            >
              {interval.label}
            </Text>
          </PressableScaleMotion>
        );
      })}
    </View>
  );
}

function MarketTradeDetailsView({
  data,
  market,
  onClose,
  onTradeCreated,
}: {
  data: DashboardData;
  market: LiveMarketPrice | null;
  onClose: () => void;
  onTradeCreated: (orderId?: string) => void | Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const [selectedInterval, setSelectedInterval] =
    useState<CandleInterval>("1m");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartRetry, setChartRetry] = useState(0);
  const [orderVolume, setOrderVolume] = useState("0.01");
  const [leverage, setLeverage] = useState("100");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [submitSide, setSubmitSide] = useState<"buy" | "sell" | null>(null);

  const marketSymbol = market?.symbol ?? null;
  const sheetWidth = Math.min(width, 520);
  const chartWidth = Math.max(sheetWidth - 92, 250);
  const orderVolumeNumber = Number.parseFloat(orderVolume) || 0;
  const leverageNumber = Number.parseInt(leverage, 10);
  const leverageIsValid =
    Number.isInteger(leverageNumber) && leverageNumber > 0;
  const marginRequired = market
    ? (market.marketPrice * orderVolumeNumber) /
      (leverageIsValid ? leverageNumber : 1)
    : null;
  const reservedMargin = data.openTrades.reduce(
    (total, trade) => total + getTradeMargin(trade),
    0,
  );
  const floatingPnl = data.openTrades.reduce(
    (total, trade) => total + getTradePnl(trade),
    0,
  );
  const accountFreeMargin =
    data.balance === null ? null : data.balance + floatingPnl;
  const estimatedFreeMargin =
    accountFreeMargin !== null && marginRequired !== null
      ? accountFreeMargin - marginRequired
      : null;
  const priceDigits = market ? getPriceDigits(market.marketPrice) : 2;
  const spread = market ? Math.max(market.ask - market.bid, 0) : 0;
  const chartValues = chartData.map((point) => point.value);
  const dataMax = chartValues.length ? Math.max(...chartValues) : 0;
  const dataMin = chartValues.length ? Math.min(...chartValues) : 0;
  const chartPadding = Math.max((dataMax - dataMin) * 0.15, dataMax * 0.002, 1);
  const yAxisOffset = Math.max(dataMin - chartPadding, 0);
  const chartMaxValue = Math.max(dataMax - yAxisOffset + chartPadding, 1);

  const switchChartInterval = useCallback(
    (nextInterval: CandleInterval) => {
      if (nextInterval === selectedInterval) return;

      setSelectedInterval(nextInterval);
      playSubtleTapHaptic();
    },
    [selectedInterval],
  );

  useEffect(() => {
    if (!marketSymbol) return;

    let isCancelled = false;

    async function loadChart() {
      if (!marketSymbol) return;

      setChartLoading(true);
      setChartError(null);

      try {
        const candles = await fetchCandles(marketSymbol, selectedInterval);
        const points = candles
          .map((candle) => {
            const value = Number(candle.close);
            if (!Number.isFinite(value)) return null;

            return {
              time: candle.time,
              value,
            };
          })
          .filter(
            (point): point is { time: string; value: number } => point !== null,
          );
        const labelEvery = Math.max(1, Math.floor(points.length / 4));
        const nextChartData = points.map((point, index) => {
          const date = formatChartDate(point.time, selectedInterval);
          const shouldShowLabel =
            index % labelEvery === 0 || index === points.length - 1;

          return {
            value: point.value,
            dataPointText: point.value.toFixed(priceDigits),
            date,
            ...(shouldShowLabel
              ? {
                  label: date,
                  labelTextStyle: {
                    color: "#858585",
                    fontSize: 10,
                    width: 58,
                  },
                }
              : {}),
          };
        });

        if (!isCancelled) {
          setChartData(nextChartData);
        }
      } catch (error) {
        if (!isCancelled) {
          setChartError(
            error instanceof Error
              ? error.message
              : "Chart data is unavailable",
          );
          setChartData([]);
        }
      } finally {
        if (!isCancelled) {
          setChartLoading(false);
        }
      }
    }

    loadChart();

    return () => {
      isCancelled = true;
    };
  }, [chartRetry, marketSymbol, selectedInterval]);

  if (!market) return null;

  const updateNumericValue = (
    value: string,
    fallback: number,
    delta: number,
    min: number,
    digits = 2,
  ) => {
    const parsed = Number.parseFloat(value);
    const next = Math.max(
      min,
      (Number.isFinite(parsed) ? parsed : fallback) + delta,
    );
    return digits === 0 ? String(Math.round(next)) : next.toFixed(digits);
  };

  const submitOrder = async (type: "buy" | "sell") => {
    const entryPrice = type === "buy" ? market.ask : market.bid;
    const takeProfitValue = takeProfit
      ? Number.parseFloat(takeProfit)
      : undefined;
    const stopLossValue = stopLoss ? Number.parseFloat(stopLoss) : undefined;
    const slippageValue = slippage ? Number.parseFloat(slippage) : undefined;

    if (!Number.isFinite(orderVolumeNumber) || orderVolumeNumber <= 0) {
      Alert.alert("Invalid volume", "Volume must be greater than 0.");
      return;
    }

    if (!leverageIsValid) {
      Alert.alert(
        "Invalid leverage",
        "Leverage must be a positive whole number.",
      );
      return;
    }

    if (
      slippageValue !== undefined &&
      (!Number.isFinite(slippageValue) || slippageValue < 0)
    ) {
      Alert.alert(
        "Invalid slippage",
        "Slippage must be zero or a positive number.",
      );
      return;
    }

    if (
      (takeProfitValue !== undefined &&
        (!Number.isFinite(takeProfitValue) || takeProfitValue <= 0)) ||
      (stopLossValue !== undefined &&
        (!Number.isFinite(stopLossValue) || stopLossValue <= 0))
    ) {
      Alert.alert(
        "Invalid protection",
        "Take profit and stop loss must be positive numbers.",
      );
      return;
    }

    if (
      takeProfitValue !== undefined &&
      (type === "buy"
        ? takeProfitValue <= entryPrice
        : takeProfitValue >= entryPrice)
    ) {
      Alert.alert(
        "Invalid take profit",
        type === "buy"
          ? "For buy orders, take profit must be above the buy price."
          : "For sell orders, take profit must be below the sell price.",
      );
      return;
    }

    if (
      stopLossValue !== undefined &&
      (type === "buy"
        ? stopLossValue >= entryPrice
        : stopLossValue <= entryPrice)
    ) {
      Alert.alert(
        "Invalid stop loss",
        type === "buy"
          ? "For buy orders, stop loss must be below the buy price."
          : "For sell orders, stop loss must be above the sell price.",
      );
      return;
    }

    try {
      setSubmitSide(type);
      const result = await createTrade({
        symbol: market.symbol,
        type,
        quantity: orderVolumeNumber,
        leverage: leverageNumber,
        slippage: slippageValue,
        takeProfit: takeProfitValue,
        stopLoss: stopLossValue,
      });
      void playTradePlacedHaptic();
      await onTradeCreated(result.orderId);
      Alert.alert(
        "Order created",
        `${type === "buy" ? "Buy" : "Sell"} order created successfully.`,
      );
      onClose();
    } catch (error) {
      Alert.alert(
        "Unable to create order",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSubmitSide(null);
    }
  };

  return (
    <DashboardTabFrame includeTopSafeArea={false}>
      <View className="flex-1">
        <TradeEntryScroll>
          <View className="px-5">
            <Link.AppleZoomTarget>
              <View
                collapsable={false}
                className="rounded-[22px] bg-[#292C2B] px-4 py-4"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[12px] font-extrabold uppercase text-[#858585]">
                      Market price
                    </Text>
                    <Text className="mt-1 text-[24px] font-black text-white">
                      {formatCurrency(market.marketPrice, priceDigits)}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-[16px] font-black ${
                        market.change >= 0
                          ? "text-[#28E978]"
                          : "text-[#FF5366]"
                      }`}
                    >
                      {formatPercent(market.changePercent)}
                    </Text>
                    <Text className="mt-1 text-[12px] font-bold text-[#9A9A9A]">
                      Spread {formatCurrency(spread, priceDigits)}
                    </Text>
                  </View>
                </View>

                <ChartIntervalTabs
                  onChange={switchChartInterval}
                  selectedInterval={selectedInterval}
                />

                <View className="mt-4 min-h-[286px] justify-center overflow-hidden rounded-[18px] bg-[#111827] px-2 py-4">
                  {chartLoading ? (
                    <View className="items-center justify-center py-16">
                      <ActivityIndicator color="#A594F7" />
                      <Text className="mt-3 text-[13px] font-bold text-[#9A9A9A]">
                        Loading chart
                      </Text>
                    </View>
                  ) : chartError ? (
                    <View className="items-center justify-center px-4 py-12">
                      <Text className="text-center text-[14px] font-bold text-[#FF8C99]">
                        {chartError}
                      </Text>
                      <PressableScaleMotion
                        className="mt-4 rounded-full bg-[#A594F7] px-5 py-2"
                        onPress={() => setChartRetry((value) => value + 1)}
                      >
                        <Text className="text-[13px] font-black text-[#151515]">
                          Retry
                        </Text>
                      </PressableScaleMotion>
                    </View>
                  ) : chartData.length === 0 ? (
                    <View className="items-center justify-center py-16">
                      <Text className="text-center text-[14px] font-bold text-[#9A9A9A]">
                        No candle history available for this market.
                      </Text>
                    </View>
                  ) : (
                    <LineChart
                      areaChart
                      data={chartData}
                      width={chartWidth}
                      height={210}
                      hideDataPoints
                      spacing={Math.max(
                        5,
                        Math.min(
                          13,
                          chartWidth / Math.max(chartData.length - 1, 1),
                        ),
                      )}
                      color="#A594F7"
                      thickness={2}
                      startFillColor="rgba(165,148,247,0.32)"
                      endFillColor="rgba(165,148,247,0.03)"
                      startOpacity={0.9}
                      endOpacity={0.2}
                      initialSpacing={0}
                      endSpacing={8}
                      noOfSections={4}
                      maxValue={chartMaxValue}
                      yAxisOffset={yAxisOffset}
                      yAxisColor="rgba(148,163,184,0.35)"
                      yAxisThickness={1}
                      yAxisLabelWidth={54}
                      rulesType="dotted"
                      rulesColor="rgba(148,163,184,0.22)"
                      yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                      xAxisColor="rgba(148,163,184,0.35)"
                      xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                      pointerConfig={{
                        pointerStripHeight: 210,
                        pointerStripColor: "rgba(148,163,184,0.5)",
                        pointerStripWidth: 1,
                        pointerColor: "#A594F7",
                        radius: 4,
                        activatePointersOnLongPress: true,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: ChartPoint[]) => (
                          <View className="items-center rounded-lg bg-[#A594F7] px-2 py-1">
                            <Text className="text-[10px] font-bold text-[#151515]">
                              {items[0]?.date || "--"}
                            </Text>
                            <Text className="text-[11px] font-black text-[#151515]">
                              {formatCurrency(items[0]?.value, priceDigits)}
                            </Text>
                          </View>
                        ),
                      }}
                    />
                  )}
                </View>
              </View>
            </Link.AppleZoomTarget>

            <View className="mt-5 rounded-[22px] bg-[#292C2B] px-4 py-4">
              <Text className="text-[18px] font-black text-white">
                New trade
              </Text>

              <View className="mt-4 gap-3">
                <TradeInputRow label="Volume">
                  <StepperButton
                    disabled={submitSide !== null}
                    label="-"
                    onPress={() =>
                      setOrderVolume((value) =>
                        updateNumericValue(value, 0.01, -0.01, 0.01, 2),
                      )
                    }
                  />
                  <TradeTextInput
                    editable={submitSide === null}
                    keyboardType="decimal-pad"
                    onChangeText={setOrderVolume}
                    value={orderVolume}
                  />
                  <StepperButton
                    disabled={submitSide !== null}
                    label="+"
                    onPress={() =>
                      setOrderVolume((value) =>
                        updateNumericValue(value, 0.01, 0.01, 0.01, 2),
                      )
                    }
                  />
                </TradeInputRow>

                <TradeInputRow label="Leverage">
                  <StepperButton
                    disabled={submitSide !== null}
                    label="-"
                    onPress={() =>
                      setLeverage((value) =>
                        updateNumericValue(value, 100, -1, 1, 0),
                      )
                    }
                  />
                  <TradeTextInput
                    editable={submitSide === null}
                    keyboardType="number-pad"
                    onChangeText={setLeverage}
                    value={leverage}
                  />
                  <StepperButton
                    disabled={submitSide !== null}
                    label="+"
                    onPress={() =>
                      setLeverage((value) =>
                        updateNumericValue(value, 100, 1, 1, 0),
                      )
                    }
                  />
                </TradeInputRow>

                <TradeInputRow label="Take Profit">
                  <TradeTextInput
                    editable={submitSide === null}
                    keyboardType="decimal-pad"
                    onChangeText={setTakeProfit}
                    placeholder="Not set"
                    value={takeProfit}
                  />
                </TradeInputRow>

                <TradeInputRow label="Stop Loss">
                  <TradeTextInput
                    editable={submitSide === null}
                    keyboardType="decimal-pad"
                    onChangeText={setStopLoss}
                    placeholder="Not set"
                    value={stopLoss}
                  />
                </TradeInputRow>

                <TradeInputRow label="Slippage (%)">
                  <TradeTextInput
                    editable={submitSide === null}
                    keyboardType="decimal-pad"
                    onChangeText={setSlippage}
                    placeholder="0.5"
                    value={slippage}
                  />
                </TradeInputRow>
              </View>

              <View className="mt-4 rounded-[16px] bg-[#222524] px-4 py-4">
                <SummaryRow
                  label="Margin Required"
                  value={formatCurrency(marginRequired)}
                />
                <SummaryRow
                  label="Free Margin"
                  tone={(estimatedFreeMargin ?? 0) >= 0 ? "up" : "down"}
                  value={formatCurrency(estimatedFreeMargin)}
                />
                <SummaryRow
                  label="Reserved Margin"
                  value={formatCurrency(reservedMargin)}
                />
                <SummaryRow
                  label="Leverage"
                  value={leverageIsValid ? `${leverageNumber}x` : "--"}
                />
              </View>

              <View className="mt-4 flex-row gap-3">
                <PressableScaleMotion
                  accessibilityRole="button"
                  className="h-14 flex-1 items-center justify-center rounded-[18px] bg-[#EF233C]"
                  disabled={submitSide !== null}
                  onPress={() => submitOrder("sell")}
                >
                  <Text className="text-[16px] font-black text-white">
                    {submitSide === "sell" ? "Selling..." : "Sell"}
                  </Text>
                  <Text className="mt-1 text-[11px] font-black text-white">
                    {formatCurrency(market.bid, priceDigits)}
                  </Text>
                </PressableScaleMotion>
                <PressableScaleMotion
                  accessibilityRole="button"
                  className="h-14 flex-1 items-center justify-center rounded-[18px] bg-[#009B72]"
                  disabled={submitSide !== null}
                  onPress={() => submitOrder("buy")}
                >
                  <Text className="text-[16px] font-black text-white">
                    {submitSide === "buy" ? "Buying..." : "Buy"}
                  </Text>
                  <Text className="mt-1 text-[11px] font-black text-white">
                    {formatCurrency(market.ask, priceDigits)}
                  </Text>
                </PressableScaleMotion>
              </View>
            </View>
          </View>
        </TradeEntryScroll>
        <TradeKeyboardToolbar />
      </View>
    </DashboardTabFrame>
  );
}

function TradeEntryScroll({ children }: { children: ReactNode }) {
  const KeyboardAwareScrollView =
    getKeyboardControllerPackage()?.KeyboardAwareScrollView;
  const sharedProps = {
    contentContainerStyle: { paddingBottom: 88 },
    keyboardDismissMode:
      Platform.OS === "ios" ? ("interactive" as const) : ("on-drag" as const),
    keyboardShouldPersistTaps: "handled" as const,
    showsVerticalScrollIndicator: false,
    style: { marginTop: 20 },
  };

  if (!KeyboardAwareScrollView) {
    return <ScrollView {...sharedProps}>{children}</ScrollView>;
  }

  return (
    <KeyboardAwareScrollView
      {...sharedProps}
      bottomOffset={76}
      disableScrollOnKeyboardHide
      extraKeyboardSpace={10}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

function TradeKeyboardToolbar() {
  const KeyboardToolbar = getKeyboardControllerPackage()?.KeyboardToolbar;

  if (!KeyboardToolbar) {
    return null;
  }

  return <KeyboardToolbar doneText="Done" theme={tradeKeyboardToolbarTheme} />;
}

function TradeInputRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <View>
      <Text className="mb-2 text-[12px] font-extrabold uppercase text-[#858585]">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">{children}</View>
    </View>
  );
}

function TradeTextInput({
  editable,
  keyboardType,
  onChangeText,
  placeholder,
  value,
}: {
  editable: boolean;
  keyboardType: "decimal-pad" | "number-pad";
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <TextInput
      className="h-11 flex-1 rounded-[14px] bg-[#1C1F1E] px-4 text-center text-[15px] font-black text-white"
      editable={editable}
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#777D7A"
      value={value}
    />
  );
}

function StepperButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScaleMotion
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#1C1F1E]"
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-[20px] font-black text-white">{label}</Text>
    </PressableScaleMotion>
  );
}

function SummaryRow({
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
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-[12px] font-bold text-[#9A9A9A]">{label}</Text>
      <Text className={`text-[13px] font-black ${valueClass}`}>{value}</Text>
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
  onRefresh: () => Promise<DashboardData | null>;
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
        <TabEaseItem>
          <Header user={user} />
        </TabEaseItem>
        <TabEaseItem className="items-center px-6 pt-8" delay={45}>
          <Text className="text-[48px] font-black leading-[54px] tracking-normal text-white">
            {formatCurrency(accountEquity)}
          </Text>
          <View className="mt-1 flex-row items-center gap-3">
            <Text
              className={`text-[18px] font-black ${
                openPnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
              }`}
            >
              {formatSignedCurrency(openPnl)}
            </Text>
            <View className="rounded-lg bg-[#255F3C] px-3 py-1">
              <Text
                className={`text-[16px] font-black ${
                  openPnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
                }`}
              >
                {formatPercent(openPct)}
              </Text>
            </View>
          </View>
        </TabEaseItem>

        <TabEaseItem
          className="flex-row flex-wrap gap-3 px-6 pt-12"
          delay={90}
        >
          {accountStats.map((stat) => (
            <View key={stat.label} className="w-[36%] flex-1 basis-[47%]">
              <InfoCard {...stat} />
            </View>
          ))}
        </TabEaseItem>
      </View>

      <TabEaseItem className="px-6 pt-6" delay={135}>
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
      </TabEaseItem>
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
    <PressableScaleMotion
      accessibilityRole="button"
      className="rounded-[22px] bg-[#292C2B] px-5 py-5"
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
            className={`text-[20px] font-black ${
              pnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
            }`}
          >
            {formatSignedCurrency(pnl)}
          </Text>
          <Text
            className={`mt-1 text-[14px] font-black ${
              pnl >= 0 ? "text-[#28E978]" : "text-[#FF5366]"
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
    </PressableScaleMotion>
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
    <PressableScaleMotion
      accessibilityRole="button"
      className="rounded-[22px] bg-[#292C2B] px-5 py-5"
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
          className={`text-[20px] font-black ${
            isPositive ? "text-[#28E978]" : "text-[#FF5366]"
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
    </PressableScaleMotion>
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
    ? (normalizeMarketPrice(trade.currentPrice) ?? openPrice)
    : (normalizeMarketPrice((trade as BackendClosedTrade).closePrice) ?? 0);

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
                  className={`rounded-full px-3 py-1 ${
                    isOpen ? "bg-[#235638]" : "bg-[#343635]"
                  }`}
                >
                  <Text
                    className={`text-[12px] font-black ${
                      isOpen ? "text-[#28E978]" : "text-[#BDBDBD]"
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
            <PressableScaleMotion
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-[#292C2B]"
              onPress={onDismiss}
            >
              <Text className="text-[18px] font-black text-white">x</Text>
            </PressableScaleMotion>
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
                    value={formatCurrency(
                      normalizeMarketPrice(trade.currentPrice),
                    )}
                  />
                  <DetailRow
                    label="Market price"
                    value={formatCurrency(
                      normalizeMarketPrice(trade.marketPrice),
                    )}
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
                      normalizeMarketPrice(
                        (trade as BackendClosedTrade).closePrice,
                      ),
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
                  value={formatDateTime(
                    (trade as BackendClosedTrade).closeTime,
                  )}
                />
              ) : null}
            </View>

            {isOpen ? (
              <PressableScaleMotion
                accessibilityRole="button"
                className="mt-5 h-14 items-center justify-center rounded-[18px] bg-[#4A242B]"
                disabled={isClosing}
                onPress={() => onCloseTrade(trade.orderId)}
              >
                <Text className="text-[15px] font-black text-[#FF8C99]">
                  {isClosing ? "Closing trade..." : "Close trade"}
                </Text>
              </PressableScaleMotion>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TradeKindTabs({
  kind,
  onChange,
}: {
  kind: TradeKind;
  onChange: (kind: TradeKind) => void;
}) {
  const [tabsWidth, setTabsWidth] = useState(0);
  const indicatorProgress = useRef(
    new Animated.Value(kind === "open" ? 0 : 1),
  ).current;
  const indicatorWidth = Math.max(
    (tabsWidth - tradeTabIndicatorPadding * 2) / 2,
    0,
  );
  const indicatorTranslateX = indicatorProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth],
  });
  const indicatorScaleX = indicatorProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.045, 1],
  });

  useEffect(() => {
    const animation = Animated.spring(indicatorProgress, {
      damping: 20,
      mass: 0.8,
      stiffness: 190,
      toValue: kind === "open" ? 0 : 1,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [indicatorProgress, kind]);

  return (
    <TabEaseItem delay={50}>
      <View
        className="mt-7 h-[56px] flex-row overflow-hidden rounded-[18px] bg-[#292C2B] p-1.5"
        onLayout={(event) => setTabsWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            backgroundColor: "#A594F7",
            borderRadius: 14,
            bottom: tradeTabIndicatorPadding,
            left: tradeTabIndicatorPadding,
            opacity: indicatorWidth > 0 ? 1 : 0,
            position: "absolute",
            top: tradeTabIndicatorPadding,
            transform: [
              { translateX: indicatorTranslateX },
              { scaleX: indicatorScaleX },
            ],
            width: indicatorWidth,
          }}
        />
        {(["open", "closed"] as const).map((tabKind) => {
          const isActive = kind === tabKind;

          return (
            <PressableScaleMotion
              key={tabKind}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className="h-11 flex-1 items-center justify-center rounded-[14px]"
              onPress={() => onChange(tabKind)}
            >
              <Text
                className={`text-[15px] font-black ${
                  isActive ? "text-[#151515]" : "text-[#9A9A9A]"
                }`}
              >
                {tabKind === "open" ? "Open" : "Closed"}
              </Text>
            </PressableScaleMotion>
          );
        })}
      </View>
    </TabEaseItem>
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
  onCloseTrade: (orderId: string) => void | Promise<void>;
  onRefresh: () => Promise<DashboardData | null>;
}) {
  const [kind, setKind] = useState<TradeKind>("open");
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade | null>(
    null,
  );
  const contentTransition = useRef(new Animated.Value(1)).current;
  const contentDirection = useRef(1);
  const scrollViewRef = useRef<ScrollView>(null);
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
  const switchTradeKind = useCallback(
    (nextKind: TradeKind) => {
      if (nextKind === kind) return;

      contentDirection.current = nextKind === "closed" ? 1 : -1;
      contentTransition.stopAnimation();
      contentTransition.setValue(0);
      scrollViewRef.current?.scrollTo({ animated: true, y: 0 });
      setKind(nextKind);
      playSubtleTapHaptic();
    },
    [contentTransition, kind],
  );
  const contentTranslateX = contentTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [contentDirection.current * 26, 0],
  });
  const contentScale = contentTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  useEffect(() => {
    const animation = Animated.timing(contentTransition, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [contentTransition, kind]);

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerClassName="px-6 pb-28 pt-5"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <TabEaseItem className="flex-row items-center justify-between">
          <View>
            <Text className="text-[28px] font-black text-white">Trade</Text>
            <Text className="mt-2 text-[16px] font-bold text-[#9A9A9A]">
              {isOpen
                ? "Positions currently live in the market."
                : "Completed positions and realized returns."}
            </Text>
          </View>
        </TabEaseItem>

        <TradeKindTabs kind={kind} onChange={switchTradeKind} />

        <TabEaseItem delay={95}>
          <StyledAnimatedView
            style={{
              opacity: contentTransition,
              transform: [
                { translateX: contentTranslateX },
                { scale: contentScale },
              ],
            }}
          >
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
          </StyledAnimatedView>
        </TabEaseItem>
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
  onRefresh: () => Promise<DashboardData | null>;
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
      <TabEaseItem>
        <Text className="text-[28px] font-black text-white">Profile</Text>
        <Text className="mt-2 text-[16px] font-bold text-[#9A9A9A]">
          Account identity, balance, and trades.
        </Text>
      </TabEaseItem>

      <TabEaseItem
        className="mt-8 items-center rounded-[24px] bg-[#292C2B] px-5 py-7"
        delay={55}
      >
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
      </TabEaseItem>

      <TabEaseItem
        className="mt-5 rounded-[22px] bg-[#292C2B] px-5"
        delay={100}
      >
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
      </TabEaseItem>

      {isLoading ? (
        <TabEaseItem
          className="mt-5 flex-row items-center justify-center gap-2 rounded-[18px] bg-[#292C2B] px-5 py-4"
          delay={145}
        >
          <ActivityIndicator color="#A594F7" />
          <Text className="text-[14px] font-bold text-[#9A9A9A]">
            Loading account data
          </Text>
        </TabEaseItem>
      ) : null}

      {errorMessage ? (
        <TabEaseItem
          className="mt-5 rounded-[18px] bg-[#3A2328] px-5 py-4"
          delay={145}
        >
          <Text className="text-[14px] font-bold text-[#FF8C99]">
            {errorMessage}
          </Text>
        </TabEaseItem>
      ) : null}

      <TabEaseItem delay={175}>
        <PressableScaleMotion
          accessibilityRole="button"
          className="mt-5 h-[52px] items-center justify-center rounded-[18px] border border-[#5A2D35] bg-[#392126]"
          onPress={() => {
            playSubtleTapHaptic();
            onLogout();
          }}
        >
          <Text className="text-[15px] font-black text-[#FF8C99]">Logout</Text>
        </PressableScaleMotion>
      </TabEaseItem>
    </ScrollView>
  );
}

export function DashboardTabsProvider({
  children,
  onLogout,
  user,
}: HelloWorldScreenProps & { children: ReactNode }) {
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [livePrices, setLivePrices] = useState<Record<string, LiveMarketPrice>>(
    {},
  );
  const livePricesRef = useRef(livePrices);
  const pricePollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [isClosingTrade, setIsClosingTrade] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
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
      return {
        balance: data.balance,
        openTrades: data.openTrades,
        closedTrades: data.closedTrades,
      };
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "Unable to load account data",
      );
      return null;
    } finally {
      setIsLoadingData(false);
      setIsRefreshingData(false);
    }
  }, []);
  const refreshDashboardData = useCallback(() => {
    return loadDashboardData(true);
  }, [loadDashboardData]);
  const refreshDashboardDataUntil = useCallback(
    async (
      isComplete: (data: DashboardData) => boolean,
      options?: { maxAttempts?: number; delayMs?: number },
    ) => {
      const maxAttempts = options?.maxAttempts ?? 6;
      const delayMs = options?.delayMs ?? 350;
      let latestData: DashboardData | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (attempt > 0) {
          await wait(delayMs);
        }

        latestData = await loadDashboardData(true);

        if (latestData && isComplete(latestData)) {
          return latestData;
        }
      }

      return latestData;
    },
    [loadDashboardData],
  );
  const handleTradeCreated = useCallback(
    async (orderId?: string) => {
      if (!orderId) {
        await loadDashboardData(true);
        return;
      }

      await refreshDashboardDataUntil((data) =>
        data.openTrades.some((trade) => trade.orderId === orderId),
      );
    },
    [loadDashboardData, refreshDashboardDataUntil],
  );
  const handleCloseTrade = useCallback(
    async (orderId: string) => {
      if (isClosingTrade) return;

      try {
        setIsClosingTrade(true);
        await closeTrade(orderId);
        void playTradeClosedHaptic();
        await refreshDashboardDataUntil(
          (data) =>
            !data.openTrades.some((trade) => trade.orderId === orderId) &&
            data.closedTrades.some((trade) => trade.orderId === orderId),
          { maxAttempts: 8, delayMs: 400 },
        );
      } catch (error) {
        Alert.alert(
          "Unable to close trade",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setIsClosingTrade(false);
      }
    },
    [isClosingTrade, refreshDashboardDataUntil],
  );

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [loadDashboardData, user]);

  useEffect(() => {
    livePricesRef.current = livePrices;

    if (
      hasAllRequiredCryptoPrices(livePrices) &&
      pricePollingIntervalRef.current
    ) {
      clearInterval(pricePollingIntervalRef.current);
      pricePollingIntervalRef.current = null;
    }
  }, [livePrices]);

  useEffect(() => {
    if (!user) return;

    const webSocketUrl = getWebSocketUrl();
    if (!webSocketUrl) return;

    const socket = new WebSocket(webSocketUrl);

    socket.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(String(event.data));
        const data =
          typeof parsedMessage === "string"
            ? JSON.parse(parsedMessage)
            : parsedMessage;

        setLivePrices((previousPrices) => {
          const nextPrices = mergeLivePricePayloads(previousPrices, [data]);
          livePricesRef.current = nextPrices;
          return nextPrices;
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

  useEffect(() => {
    if (!user) return;

    let isCancelled = false;
    let requestInFlight = false;

    const stopPollingIfComplete = () => {
      if (
        hasAllRequiredCryptoPrices(livePricesRef.current) &&
        pricePollingIntervalRef.current
      ) {
        clearInterval(pricePollingIntervalRef.current);
        pricePollingIntervalRef.current = null;
      }
    };

    const pollLatestPrices = async () => {
      if (isCancelled || requestInFlight) return;

      requestInFlight = true;

      try {
        const latestPrices = await fetchLatestPrices();
        if (isCancelled || latestPrices.length === 0) return;

        const nextPrices = mergeLivePricePayloads(
          livePricesRef.current,
          latestPrices,
        );
        livePricesRef.current = nextPrices;
        setLivePrices(nextPrices);
        stopPollingIfComplete();
      } catch (error) {
        console.warn("Unable to poll latest crypto prices", error);
      } finally {
        requestInFlight = false;
      }
    };

    if (!hasAllRequiredCryptoPrices(livePricesRef.current)) {
      void pollLatestPrices();
      pricePollingIntervalRef.current = setInterval(pollLatestPrices, 1000);
    }

    return () => {
      isCancelled = true;
      if (pricePollingIntervalRef.current) {
        clearInterval(pricePollingIntervalRef.current);
        pricePollingIntervalRef.current = null;
      }
    };
  }, [user]);

  const contextValue = useMemo<DashboardTabsContextValue>(
    () => ({
      data: enhancedDashboardData,
      errorMessage: dataError,
      isClosingTrade,
      isLoadingData,
      isRefreshingData,
      livePrices,
      onCloseTrade: handleCloseTrade,
      onTradeCreated: handleTradeCreated,
      onLogout,
      onRefresh: refreshDashboardData,
      user,
    }),
    [
      dataError,
      enhancedDashboardData,
      handleCloseTrade,
      handleTradeCreated,
      isClosingTrade,
      isLoadingData,
      isRefreshingData,
      livePrices,
      onLogout,
      refreshDashboardData,
      user,
    ],
  );

  return (
    <DashboardTabsContext.Provider value={contextValue}>
      {children}
    </DashboardTabsContext.Provider>
  );
}

export function CryptoDetailsScreen() {
  const params = useLocalSearchParams();
  const symbolParam = params.symbol;
  const symbol = useMemo(() => {
    const rawSymbol = Array.isArray(symbolParam) ? symbolParam[0] : symbolParam;
    return rawSymbol ? decodeURIComponent(String(rawSymbol)) : "";
  }, [symbolParam]);
  const { data, livePrices, onTradeCreated } = useDashboardTabsContext();
  const market = useMemo(() => {
    if (!symbol) return null;

    return (
      getLiveAssetCandidates(symbol)
        .map((candidate) => livePrices[candidate])
        .find(Boolean) ??
      Object.values(livePrices).find(
        (price) => price.symbol.toUpperCase() === symbol.toUpperCase(),
      ) ??
      null
    );
  }, [livePrices, symbol]);
  const closeDetails = useCallback(() => {
    playSubtleTapHaptic();

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/wallet");
  }, []);
  const screenTitle = market ? getMarketName(market.symbol) : "Market";

  if (!market) {
    const isWaitingForPrices = Object.keys(livePrices).length === 0;

    return (
      <>
        <Stack.Screen options={{ title: screenTitle }} />
        <DashboardTabFrame includeTopSafeArea={false}>
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#A594F7" />
            <Text className="mt-3 text-center text-[14px] font-bold text-[#9A9A9A]">
              {isWaitingForPrices
                ? "Waiting for live crypto prices"
                : "Market details are unavailable"}
            </Text>
          </View>
        </DashboardTabFrame>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />
      <MarketTradeDetailsView
        data={data}
        market={market}
        onClose={closeDetails}
        onTradeCreated={onTradeCreated}
      />
    </>
  );
}

export function WalletDashboardTabScreen() {
  const {
    data,
    isRefreshingData,
    livePrices,
    onRefresh,
    user,
  } = useDashboardTabsContext();
  const animationKey = useFocusedTabAnimationKey();

  return (
    <FocusedTabAnimationProvider value={animationKey}>
      <DashboardTabFrame>
        <WalletTab
          data={data}
          isRefreshing={isRefreshingData}
          livePrices={livePrices}
          onRefresh={onRefresh}
          user={user}
        />
      </DashboardTabFrame>
    </FocusedTabAnimationProvider>
  );
}

export function TradeDashboardTabScreen() {
  const { data, isClosingTrade, isRefreshingData, onCloseTrade, onRefresh } =
    useDashboardTabsContext();
  const animationKey = useFocusedTabAnimationKey();

  return (
    <FocusedTabAnimationProvider value={animationKey}>
      <DashboardTabFrame>
        <TradesTab
          data={data}
          isClosingTrade={isClosingTrade}
          isRefreshing={isRefreshingData}
          onCloseTrade={onCloseTrade}
          onRefresh={onRefresh}
        />
      </DashboardTabFrame>
    </FocusedTabAnimationProvider>
  );
}

export function ProfileDashboardTabScreen() {
  const {
    data,
    errorMessage,
    isLoadingData,
    isRefreshingData,
    onLogout,
    onRefresh,
    user,
  } = useDashboardTabsContext();
  const animationKey = useFocusedTabAnimationKey();

  return (
    <FocusedTabAnimationProvider value={animationKey}>
      <DashboardTabFrame>
        <ProfileTab
          data={data}
          errorMessage={errorMessage}
          isLoading={isLoadingData}
          isRefreshing={isRefreshingData}
          onLogout={onLogout}
          onRefresh={onRefresh}
          user={user}
        />
      </DashboardTabFrame>
    </FocusedTabAnimationProvider>
  );
}

export function HelloWorldScreen({ onLogout, user }: HelloWorldScreenProps) {
  return (
    <DashboardTabsProvider onLogout={onLogout} user={user}>
      <WalletDashboardTabScreen />
    </DashboardTabsProvider>
  );
}
