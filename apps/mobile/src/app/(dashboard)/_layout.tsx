import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack, router } from "expo-router";

import { DashboardTabsProvider } from "@/components/HelloWorldScreen";
import {
  logoutMobileSession,
  MobileSessionResponse,
  restoreMobileSession,
} from "@/lib/mobile-auth-api";

export default function DashboardLayout() {
  const [user, setUser] = useState<MobileSessionResponse["user"] | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    restoreMobileSession()
      .then((session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSessionReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await logoutMobileSession();
    setUser(null);
    router.replace("/");
  }, []);

  if (!isSessionReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#171918]">
        <ActivityIndicator color="#A594F7" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  return (
    <DashboardTabsProvider onLogout={logout} user={user}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="crypto/[symbol]"
          options={{
            animationMatchesGesture: true,
            fullScreenGestureEnabled: true,
            gestureEnabled: true,
            headerBackButtonDisplayMode: "minimal",
            headerBackTitle: "Wallet",
            headerBlurEffect: "systemChromeMaterialDark",
            headerLargeTitle: false,
            headerShadowVisible: false,
            headerShown: true,
            headerStyle: { backgroundColor: "#171918" },
            headerTintColor: "#A594F7",
            headerTitleStyle: {
              color: "#FFFFFF",
              fontSize: 17,
              fontWeight: "800",
            },
            title: "Market",
          }}
        />
      </Stack>
    </DashboardTabsProvider>
  );
}
