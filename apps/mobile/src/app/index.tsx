import { useCallback, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthBottomSheet } from "@/components/AuthBottomSheet";
import { BiometricSetupScreen } from "@/components/BiometricSetupScreen";
import { CreatePinScreen } from "@/components/CreatePinScreen";
import { GoogleAuthSheet } from "@/components/GoogleAuthSheet";
import { HelloWorldScreen } from "@/components/HelloWorldScreen";
import { MoodCharacters } from "@/components/MoodCharacters";
import { TradingSetupIllustration } from "@/components/TradingSetupIllustration";
import { TradingValueIcon } from "@/components/TradingValueIcon";
import { WalletLoadingScreen } from "@/components/WalletLoadingScreen";
import { logAuthEvent } from "@/lib/auth-logger";

type AppScreen =
  | "onboarding"
  | "setup"
  | "pin"
  | "walletLoading"
  | "biometric"
  | "hello";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("onboarding");
  const [isAuthSheetVisible, setIsAuthSheetVisible] = useState(false);
  const [googleAuthMode, setGoogleAuthMode] = useState<"login" | "create">(
    "login",
  );
  const [isGoogleAuthSheetVisible, setIsGoogleAuthSheetVisible] =
    useState(false);
  const { height } = useWindowDimensions();
  const completeOnboarding = useCallback(() => {
    logAuthEvent("onboarding_completed");
    setScreen("hello");
  }, []);

  if (screen === "pin") {
    return (
      <CreatePinScreen
        onBack={() => {
          logAuthEvent("pin_screen_back_pressed");
          setScreen("setup");
        }}
        onComplete={() => {
          logAuthEvent("pin_flow_completed");
          setScreen("walletLoading");
        }}
      />
    );
  }

  if (screen === "walletLoading") {
    return (
      <WalletLoadingScreen
        onComplete={() => {
          logAuthEvent("wallet_creation_animation_completed");
          setScreen("biometric");
        }}
      />
    );
  }

  if (screen === "biometric") {
    return <BiometricSetupScreen onComplete={completeOnboarding} />;
  }

  if (screen === "hello") {
    return <HelloWorldScreen />;
  }

  if (screen === "setup") {
    return (
      <View className="flex-1 bg-[#1B1B1B]">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-7 pb-8 pt-5">
            <View className="h-10 flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-10 w-10 items-start justify-center active:opacity-70"
                onPress={() => {
                  logAuthEvent("setup_back_pressed");
                  setScreen("onboarding");
                }}
              >
                <Text className="text-[32px] leading-9 text-white">‹</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Help"
                className="h-10 w-10 items-end justify-center active:opacity-70"
              >
                <Text className="text-[26px] font-bold leading-8 text-white">
                  ?
                </Text>
              </Pressable>
            </View>

            <View className="mt-8 items-center">
              <TradingSetupIllustration />
              <Text className="mt-5 text-center text-[31px] font-black tracking-normal text-white">
                Start Trading
              </Text>
              <Text className="mt-2 text-center text-[16px] leading-6 text-[#9A9A9A]">
                Login or create your Exness account to access markets, balances,
                and order tools.
              </Text>
            </View>

            <View className="mt-9 gap-7">
              <View className="flex-row gap-4">
                <TradingValueIcon name="setup" />
                <View className="flex-1">
                  <Text className="text-[18px] font-black tracking-normal text-white">
                    Seamless account setup
                  </Text>
                  <Text className="mt-1 text-[15px] leading-6 text-[#9A9A9A]">
                    Sign in with Google and we will prepare your demo balance
                    and trading profile automatically.
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-4">
                <TradingValueIcon name="security" />
                <View className="flex-1">
                  <Text className="text-[18px] font-black tracking-normal text-white">
                    Device PIN protection
                  </Text>
                  <Text className="mt-1 text-[15px] leading-6 text-[#9A9A9A]">
                    Add a PIN for this phone before you manage account actions
                    or saved preferences.
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-4">
                <TradingValueIcon name="sync" />
                <View className="flex-1">
                  <Text className="text-[18px] font-black tracking-normal text-white">
                    Synced trading access
                  </Text>
                  <Text className="mt-1 text-[15px] leading-6 text-[#9A9A9A]">
                    Your mobile session connects to the same backend user used
                    for balances, orders, and market history.
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-1" />

            <Pressable
              accessibilityRole="button"
              className="h-[54px] items-center justify-center rounded-full bg-[#A594F7] active:opacity-80"
              onPress={() => {
                logAuthEvent("auth_options_sheet_opened");
                setIsAuthSheetVisible(true);
              }}
            >
              <Text className="text-[17px] font-extrabold tracking-normal text-[#151515]">
                Login
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
        <AuthBottomSheet
          visible={isAuthSheetVisible}
          onClose={() => setIsAuthSheetVisible(false)}
          onGoogleSelected={(mode) => {
            logAuthEvent("google_sheet_opened", { mode });
            setGoogleAuthMode(mode);
            setIsGoogleAuthSheetVisible(true);
          }}
        />
        <GoogleAuthSheet
          mode={googleAuthMode}
          visible={isGoogleAuthSheetVisible}
          onClose={() => {
            logAuthEvent("google_sheet_closed", { mode: googleAuthMode });
            setIsGoogleAuthSheetVisible(false);
          }}
          onAuthenticated={(hasMobilePin) => {
            logAuthEvent("auth_flow_authenticated", {
              hasMobilePin,
              nextScreen: hasMobilePin ? "hello" : "pin",
            });
            setScreen(hasMobilePin ? "hello" : "pin");
          }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="relative flex-1 overflow-hidden px-6">
          <View className="z-10 items-center pt-12">
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.08}
              className={`text-center font-black tracking-normal text-[#030303] ${
                height < 720
                  ? "text-[48px] leading-[54px]"
                  : "text-[56px] leading-[62px]"
              }`}
            >
              Not Sure{"\n"}About Your{"\n"}Mood?
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Let us help"
              className="mt-7 min-h-[58px] flex-row items-center gap-3.5 self-center rounded-full border border-[#E4E4E4] bg-[#F1F1F1] py-0 pl-7 pr-2 active:scale-[0.99] active:opacity-70"
              onPress={() => {
                logAuthEvent("onboarding_help_pressed");
                setScreen("setup");
              }}
            >
              <Text
                maxFontSizeMultiplier={1.05}
                className="text-[17px] font-extrabold tracking-normal text-[#141414]"
              >
                Let Us Help
              </Text>
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#050505]">
                <Text className="-mt-px text-[24px] font-black leading-7 text-white">
                  {">"}
                </Text>
              </View>
            </Pressable>
          </View>

          <View className="pointer-events-none absolute -bottom-8 left-1/2 aspect-[39/43] w-[116%] max-w-[440px] -translate-x-1/2">
            <MoodCharacters width="100%" height="100%" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
