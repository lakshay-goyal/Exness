import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileSessionResponse } from "@/lib/mobile-auth-api";

type HelloWorldScreenProps = {
  user: MobileSessionResponse["user"] | null;
};

export function HelloWorldScreen({ user }: HelloWorldScreenProps) {
  return (
    <View className="flex-1 bg-[#1B1B1B]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-7">
          <Text className="text-center text-[34px] font-black tracking-normal text-white">
            Hello world
          </Text>
          <View className="mt-8 w-full rounded-lg bg-[#2B2B2B] px-5 py-5">
            <Text className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-[#A594F7]">
              User details
            </Text>
            <Text className="mt-4 text-[20px] font-black text-white">
              {user?.name || "Authenticated user"}
            </Text>
            <Text className="mt-2 text-[15px] font-bold text-[#B9B9B9]">
              {user?.email || "Email unavailable"}
            </Text>
            <Text className="mt-4 text-[13px] leading-5 text-[#858585]">
              User ID: {user?.id || "Unavailable"}
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#858585]">
              Mobile PIN: {user?.hasMobilePin ? "Enabled" : "Not set"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
