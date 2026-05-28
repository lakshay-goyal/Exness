import { Modal, Pressable, Text, View } from "react-native";

import { PressableScaleMotion } from "@/components/PressMotion";
import { logAuthEvent } from "@/lib/auth-logger";
import { playSubtleTapHaptic } from "@/lib/trade-haptics";

type AuthBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onGoogleSelected: (mode: "login" | "create") => void;
};

export function AuthBottomSheet({
  visible,
  onClose,
  onGoogleSelected,
}: AuthBottomSheetProps) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close authentication options"
          accessibilityRole="button"
          className="absolute inset-0 bg-black/70"
          onPress={() => {
            logAuthEvent("auth_options_sheet_closed", { source: "backdrop" });
            onClose();
          }}
        />
        <View className="rounded-t-[34px] border border-[#2A2A2A] bg-[#111111] px-6 pb-8 pt-3">
          <View className="mb-7 h-1.5 w-12 self-center rounded-full bg-[#4A4A4A]" />

          <Text className="text-center text-[28px] font-black tracking-normal text-white">
            Access your account
          </Text>
          <Text className="mx-auto mt-2 max-w-[300px] text-center text-[15px] leading-6 text-[#9A9A9A]">
            Login to manage orders, balances, watchlists, and saved market
            insights.
          </Text>

          <View className="mt-8 gap-3">
            <PressableScaleMotion
              accessibilityRole="button"
              className="h-14 flex-row items-center justify-center rounded-full bg-white"
              onPress={() => {
                playSubtleTapHaptic();
                logAuthEvent("auth_option_selected", { mode: "login" });
                onClose();
                onGoogleSelected("login");
              }}
            >
              <Text className="text-[16px] font-extrabold tracking-normal text-black">
                Login with Google
              </Text>
            </PressableScaleMotion>

            <PressableScaleMotion
              accessibilityRole="button"
              className="h-14 flex-row items-center justify-center gap-3 rounded-full border border-[#333333] bg-[#191919]"
              onPress={() => {
                playSubtleTapHaptic();
                logAuthEvent("auth_option_selected", { mode: "create" });
                onClose();
                onGoogleSelected("create");
              }}
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-white">
                <Text className="text-[15px] font-black text-black">G</Text>
              </View>
              <Text className="text-[16px] font-extrabold tracking-normal text-white">
                Create account with Google
              </Text>
            </PressableScaleMotion>
          </View>

          <PressableScaleMotion
            accessibilityRole="button"
            className="mt-6 items-center py-2"
            onPress={() => {
              logAuthEvent("auth_options_sheet_closed", { source: "not_now" });
              onClose();
            }}
          >
            <Text className="text-[14px] font-bold text-[#A6A6A6]">
              Not now
            </Text>
          </PressableScaleMotion>
        </View>
      </View>
    </Modal>
  );
}
