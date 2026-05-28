import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, router } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { DashboardTabsProvider } from "@/components/HelloWorldScreen";
import {
  logoutMobileSession,
  MobileSessionResponse,
  restoreMobileSession,
} from "@/lib/mobile-auth-api";

export default function DashboardTabsLayout() {
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
      <NativeTabs
        backgroundColor="#1C1D1E"
        blurEffect="systemChromeMaterialDark"
        disableTransparentOnScrollEdge
        iconColor={{ default: "#858585", selected: "#A594F7" }}
        indicatorColor="#A594F7"
        labelStyle={{
          default: {
            color: "#8B8B8B",
            fontSize: 11,
            fontWeight: "800",
          },
          selected: {
            color: "#A594F7",
            fontSize: 11,
            fontWeight: "800",
          },
        }}
        labelVisibilityMode="labeled"
        shadowColor="#2B2E2C"
        tintColor="#A594F7"
      >
        <NativeTabs.Trigger name="wallet">
          <NativeTabs.Trigger.Icon
            md="home"
            sf={{ default: "house", selected: "house.fill" }}
          />
          <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="trade">
          <NativeTabs.Trigger.Icon
            md="swap_horiz"
            sf="arrow.left.arrow.right"
          />
          <NativeTabs.Trigger.Label>Trade</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon
            md="person"
            sf={{
              default: "person.crop.circle",
              selected: "person.crop.circle.fill",
            }}
          />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </DashboardTabsProvider>
  );
}
