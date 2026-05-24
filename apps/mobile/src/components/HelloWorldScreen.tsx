import { ReactNode, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileSessionResponse } from "@/lib/mobile-auth-api";

type HelloWorldScreenProps = {
  user: MobileSessionResponse["user"] | null;
};

type DashboardTab = "wallet" | "open" | "closed" | "profile";
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

const assets = [
  {
    name: "Ethereum",
    symbol: "ETH",
    amount: "0.00687 ETH",
    value: "$18.98",
    change: "+$0.36",
    accent: "#F4F4F4",
    network: "ETH",
    trend: "up",
  },
  {
    name: "USDC",
    symbol: "USDC",
    amount: "2.24262 USDC",
    value: "$2.25",
    change: "-<$0.01",
    accent: "#2F86DE",
    network: "ETH",
    trend: "down",
  },
  {
    name: "Solana",
    symbol: "SOL",
    amount: "0 SOL",
    value: "$0.00",
    change: "+$0.00",
    accent: "#050505",
    network: "SOL",
    trend: "flat",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    amount: "0 ETH",
    value: "$0.00",
    change: "+$0.00",
    accent: "#F4F4F4",
    network: "BASE",
    trend: "flat",
  },
] as const;

const accountStats = [
  { label: "Available", value: "$18.98" },
  { label: "Reserved", value: "$2.25" },
  { label: "Open P/L", value: "+$0.36", tone: "up" },
  { label: "Closed P/L", value: "+$3.41", tone: "up" },
] as const;

const openTrades = [
  {
    pair: "ETH/USD",
    side: "Buy",
    size: "0.00687 ETH",
    entry: "$2,707.42",
    current: "$2,759.78",
    pnl: "+$0.36",
    pct: "+1.74%",
    margin: "$4.75",
    leverage: "4x",
  },
  {
    pair: "SOL/USD",
    side: "Buy",
    size: "0.25 SOL",
    entry: "$166.20",
    current: "$166.20",
    pnl: "+$0.00",
    pct: "0.00%",
    margin: "$0.00",
    leverage: "2x",
  },
] as const;

const closedTrades = [
  {
    pair: "BTC/USD",
    side: "Sell",
    size: "0.001 BTC",
    entry: "$69,420.00",
    exit: "$68,885.12",
    pnl: "+$2.47",
    closedAt: "Today, 09:18",
  },
  {
    pair: "ETH/USD",
    side: "Buy",
    size: "0.004 ETH",
    entry: "$2,632.15",
    exit: "$2,868.44",
    pnl: "+$0.94",
    closedAt: "Yesterday, 21:44",
  },
  {
    pair: "USDC/USD",
    side: "Buy",
    size: "2.24 USDC",
    entry: "$1.00",
    exit: "$1.00",
    pnl: "$0.00",
    closedAt: "May 22, 18:03",
  },
] as const;

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
    { icon: "swap", label: "Open", tab: "open" },
    { icon: "clock", label: "Closed", tab: "closed" },
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
              className="min-h-[54px] min-w-[60px] items-center justify-center gap-1 active:opacity-70"
              onPress={() => onTabChange(tab)}
            >
              <Icon
                color={isActive ? "#A594F7" : "#858585"}
                name={icon}
                size={27}
              />
              <Text
                className={`text-[11px] font-extrabold tracking-normal ${
                  isActive ? "text-[#A594F7]" : "text-[#8B8B8B]"
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
        className="h-[54px] w-[54px] rounded-full bg-[#303231]"
        source={{ uri: user.image }}
      />
    );
  }

  return (
    <View className="h-[54px] w-[54px] items-center justify-center rounded-full bg-[#303231]">
      <Text className="text-[18px] font-black text-[#A594F7]">{initials}</Text>
    </View>
  );
}

function Header({
  accountName = "Account 2",
  user,
}: {
  accountName?: string;
  user: MobileSessionResponse["user"] | null;
}) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-3">
      <View className="flex-row items-center gap-4">
        <Avatar user={user} />
        <View>
          <Text
            numberOfLines={1}
            className="max-w-[210px] text-[18px] font-black text-[#8D9290]"
          >
            @
            {user?.name?.replace(/\s+/g, "").toLowerCase() || "alexsmithmobbin"}
          </Text>
          <Text className="text-[25px] font-black tracking-normal text-white">
            {accountName} <Text className="text-[#C9CFCC]">v</Text>
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-4">
        <Icon color="#F3F6F4" name="expand" size={31} />
        <Icon color="#F3F6F4" name="search" size={34} />
      </View>
    </View>
  );
}

function ActionButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <Pressable className="h-[92px] flex-1 items-center justify-center rounded-[22px] bg-[#2C2E2E] active:opacity-75">
      <Icon color="#A594F7" name={icon} size={36} />
      <Text className="mt-2 text-[16px] font-black text-[#9B9B9B]">
        {label}
      </Text>
    </Pressable>
  );
}

function TokenLogo({
  network,
  symbol,
}: {
  network: string;
  symbol: "ETH" | "SOL" | "USDC";
}) {
  if (symbol === "ETH") {
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

  if (symbol === "USDC") {
    return (
      <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#2F86DE]">
        <Text className="text-[29px] font-black text-white">$</Text>
        <View className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full border-2 border-[#2B2D2D] bg-white">
          <Text className="text-[11px] font-black text-[#222]">
            {network[0]}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-black">
      <View className="h-2 w-9 -skew-x-12 rounded-full bg-[#00FFA3]" />
      <View className="my-1.5 h-2 w-9 -skew-x-12 rounded-full bg-[#64D7FF]" />
      <View className="h-2 w-9 -skew-x-12 rounded-full bg-[#A855F7]" />
    </View>
  );
}

function AssetRow({ asset }: { asset: (typeof assets)[number] }) {
  const trendClass =
    asset.trend === "up"
      ? "text-[#28E978]"
      : asset.trend === "down"
        ? "text-[#FF5366]"
        : "text-[#A2A2A2]";

  return (
    <View className="min-h-[84px] flex-row items-center rounded-[22px] bg-[#292C2B] px-4">
      <TokenLogo network={asset.network} symbol={asset.symbol} />
      <View className="ml-4 flex-1">
        <Text className="text-[22px] font-black text-white">{asset.name}</Text>
        <Text className="mt-1 text-[17px] font-bold text-[#9A9A9A]">
          {asset.amount}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-[23px] font-black text-white">{asset.value}</Text>
        <Text className={`mt-1 text-[17px] font-bold ${trendClass}`}>
          {asset.change}
        </Text>
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
  tone?: "up";
  value: string;
}) {
  return (
    <View className="min-h-[74px] flex-1 rounded-[18px] bg-[#292C2B] px-4 py-4">
      <Text className="text-[13px] font-extrabold uppercase text-[#8D9290]">
        {label}
      </Text>
      <Text
        className={`mt-2 text-[20px] font-black ${
          tone === "up" ? "text-[#28E978]" : "text-white"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function WalletTab({
  onTabChange,
  user,
}: {
  onTabChange: (tab: DashboardTab) => void;
  user: MobileSessionResponse["user"] | null;
}) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-28"
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-[#173120] pb-7">
        <Header user={user} />
        <View className="items-center px-6 pt-11">
          <Text className="text-[70px] font-black leading-[76px] tracking-normal text-white">
            $21.23
          </Text>
          <View className="mt-1 flex-row items-center gap-3">
            <Text className="text-[27px] font-black text-[#28E978]">
              +$0.36
            </Text>
            <View className="rounded-lg bg-[#255F3C] px-3 py-1">
              <Text className="text-[24px] font-black text-[#28E978]">
                +1.74%
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-12 flex-row gap-3 px-6">
          <ActionButton icon="arrowDown" label="Receive" />
          <ActionButton icon="arrowUp" label="Send" />
          <ActionButton icon="swap" label="Swap" />
          <ActionButton icon="buy" label="Buy" />
        </View>
      </View>

      <View className="px-6 pt-6">
        <View className="flex-row flex-wrap gap-3">
          {accountStats.map((stat) => (
            <View key={stat.label} className="w-[48%] flex-1 basis-[47%]">
              <InfoCard {...stat} />
            </View>
          ))}
        </View>

        <Pressable className="mt-5 min-h-[86px] flex-row items-center rounded-[18px] bg-[#292C2B] px-4 active:opacity-75">
          <View className="h-[58px] w-[58px] items-center justify-center">
            <Icon color="#A594F7" name="search" size={55} />
          </View>
          <Text className="ml-4 flex-1 text-[19px] font-black leading-7 text-white">
            Search from Explore to find new tokens faster
          </Text>
          <Text className="text-[24px] font-black text-[#777]">x</Text>
        </Pressable>

        <View className="mt-8 flex-row items-center justify-between">
          <Text className="text-[24px] font-black text-white">Assets</Text>
          <Pressable onPress={() => onTabChange("open")}>
            <Text className="text-[15px] font-black text-[#A594F7]">
              Open trades
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 gap-4">
          {assets.map((asset, index) => (
            <AssetRow
              key={`${asset.name}-${asset.network}-${index}`}
              asset={asset}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function TradeCard({ trade }: { trade: (typeof openTrades)[number] }) {
  return (
    <View className="rounded-[22px] bg-[#292C2B] px-5 py-5">
      <View className="flex-row items-start justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[23px] font-black text-white">
              {trade.pair}
            </Text>
            <View className="rounded-full bg-[#235638] px-3 py-1">
              <Text className="text-[12px] font-black text-[#28E978]">
                {trade.side}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-[15px] font-bold text-[#9A9A9A]">
            {trade.size} | {trade.leverage}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[23px] font-black text-[#28E978]">
            {trade.pnl}
          </Text>
          <Text className="mt-1 text-[15px] font-black text-[#28E978]">
            {trade.pct}
          </Text>
        </View>
      </View>

      <View className="mt-5 h-px bg-[#3A3E3C]" />

      <View className="mt-5 flex-row justify-between">
        <TradeMetric label="Entry" value={trade.entry} />
        <TradeMetric label="Current" value={trade.current} />
        <TradeMetric alignRight label="Margin" value={trade.margin} />
      </View>
    </View>
  );
}

function ClosedTradeCard({ trade }: { trade: (typeof closedTrades)[number] }) {
  const isPositive = trade.pnl.startsWith("+");

  return (
    <View className="rounded-[22px] bg-[#292C2B] px-5 py-5">
      <View className="flex-row items-start justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[23px] font-black text-white">
              {trade.pair}
            </Text>
            <View className="rounded-full bg-[#343635] px-3 py-1">
              <Text className="text-[12px] font-black text-[#BDBDBD]">
                {trade.side}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-[15px] font-bold text-[#9A9A9A]">
            {trade.size} | {trade.closedAt}
          </Text>
        </View>
        <Text
          className={`text-[23px] font-black ${
            isPositive ? "text-[#28E978]" : "text-white"
          }`}
        >
          {trade.pnl}
        </Text>
      </View>

      <View className="mt-5 h-px bg-[#3A3E3C]" />

      <View className="mt-5 flex-row justify-between">
        <TradeMetric label="Entry" value={trade.entry} />
        <TradeMetric alignRight label="Exit" value={trade.exit} />
      </View>
    </View>
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

function TradesTab({
  kind,
  onTabChange,
}: {
  kind: "open" | "closed";
  onTabChange: (tab: DashboardTab) => void;
}) {
  const isOpen = kind === "open";

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-28 pt-5"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[34px] font-black text-white">
            {isOpen ? "Open Trades" : "Closed Trades"}
          </Text>
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
          className={`h-11 flex-1 items-center justify-center rounded-[14px] ${
            isOpen ? "bg-[#A594F7]" : ""
          }`}
          onPress={() => onTabChange("open")}
        >
          <Text
            className={`text-[15px] font-black ${
              isOpen ? "text-[#151515]" : "text-[#9A9A9A]"
            }`}
          >
            Open
          </Text>
        </Pressable>
        <Pressable
          className={`h-11 flex-1 items-center justify-center rounded-[14px] ${
            !isOpen ? "bg-[#A594F7]" : ""
          }`}
          onPress={() => onTabChange("closed")}
        >
          <Text
            className={`text-[15px] font-black ${
              !isOpen ? "text-[#151515]" : "text-[#9A9A9A]"
            }`}
          >
            Closed
          </Text>
        </Pressable>
      </View>

      <View className="mt-6 flex-row gap-3">
        <InfoCard
          label={isOpen ? "Open Value" : "Realized"}
          tone="up"
          value={isOpen ? "$21.23" : "+$3.41"}
        />
        <InfoCard
          label={isOpen ? "Live P/L" : "Win Rate"}
          tone="up"
          value={isOpen ? "+$0.36" : "67%"}
        />
      </View>

      <View className="mt-6 gap-4">
        {isOpen
          ? openTrades.map((trade) => (
              <TradeCard key={trade.pair} trade={trade} />
            ))
          : closedTrades.map((trade) => (
              <ClosedTradeCard
                key={`${trade.pair}-${trade.closedAt}`}
                trade={trade}
              />
            ))}
      </View>
    </ScrollView>
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

function ProfileTab({ user }: { user: MobileSessionResponse["user"] | null }) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 pb-28 pt-5"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[34px] font-black text-white">Profile</Text>
      <Text className="mt-2 text-[16px] font-bold text-[#9A9A9A]">
        Account identity and mobile security.
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
        <ProfileRow label="User ID" value={user?.id || "Unavailable"} />
        <ProfileRow label="Account" value="Account 2" />
        <ProfileRow label="Portfolio Balance" value="$21.23" />
        <ProfileRow label="Available Balance" value="$18.98" />
        <ProfileRow label="Open Trades" value={`${openTrades.length}`} />
        <View className="py-4">
          <Text className="text-[13px] font-extrabold uppercase text-[#858585]">
            Closed Trades
          </Text>
          <Text className="mt-2 text-[17px] font-black text-white">
            {closedTrades.length}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export function HelloWorldScreen({ user }: HelloWorldScreenProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("wallet");
  const { width } = useWindowDimensions();

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
          <WalletTab onTabChange={setActiveTab} user={user} />
        ) : null}
        {activeTab === "open" ? (
          <TradesTab kind="open" onTabChange={setActiveTab} />
        ) : null}
        {activeTab === "closed" ? (
          <TradesTab kind="closed" onTabChange={setActiveTab} />
        ) : null}
        {activeTab === "profile" ? <ProfileTab user={user} /> : null}
      </View>
    </ScreenShell>
  );
}
