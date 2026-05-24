import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { getAuthErrorMessage, logAuthEvent } from "@/lib/auth-logger";
import { signInWithGoogleInBrowser } from "@/lib/google-auth-flow";
import {
  MobileSessionResponse,
  syncMobileSession,
} from "@/lib/mobile-auth-api";

type GoogleAuthSheetProps = {
  mode: "login" | "create";
  visible: boolean;
  onClose: () => void;
  onAuthenticated: (user: MobileSessionResponse["user"]) => void;
};

export function GoogleAuthSheet({
  mode,
  visible,
  onClose,
  onAuthenticated,
}: GoogleAuthSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const title = mode === "login" ? "Login with Google" : "Create with Google";

  async function handleContinue() {
    setIsLoading(true);
    setError("");
    logAuthEvent("google_sheet_continue_pressed", { mode });

    try {
      logAuthEvent("google_social_sign_in_started", { mode });
      await signInWithGoogleInBrowser();
      logAuthEvent("google_social_sign_in_completed", { mode });
      const session = await syncMobileSession();
      logAuthEvent("google_mobile_session_ready", {
        mode,
        userId: session.user.id,
        email: session.user.email,
        hasMobilePin: session.user.hasMobilePin,
      });
      onClose();
      onAuthenticated(session.user);
    } catch (err) {
      const message = getAuthErrorMessage(err, "Google authentication failed.");
      logAuthEvent(
        "google_auth_flow_failed",
        {
          mode,
          error: message,
        },
        "error",
      );
      setError(message);
    } finally {
      setIsLoading(false);
      logAuthEvent("google_auth_flow_finished", { mode });
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Close Google authentication"
          accessibilityRole="button"
          className="absolute inset-0 bg-black/70"
          disabled={isLoading}
          onPress={onClose}
        />
        <View className="rounded-t-[34px] border border-[#2A2A2A] bg-[#111111] px-6 pb-8 pt-3">
          <View className="mb-7 h-1.5 w-12 self-center rounded-full bg-[#4A4A4A]" />

          <View className="h-[72px] w-[72px] items-center justify-center self-center rounded-full bg-white">
            <Text className="text-[34px] font-black text-black">G</Text>
          </View>

          <Text className="mt-6 text-center text-[28px] font-black tracking-normal text-white">
            {title}
          </Text>
          <Text className="mx-auto mt-2 max-w-[310px] text-center text-[15px] leading-6 text-[#9A9A9A]">
            Continue in Google's secure sign-in sheet. After login, we will take
            you straight to your home screen.
          </Text>

          {error ? (
            <View className="mt-5 rounded-2xl border border-[#4A2222] bg-[#2A1515] px-4 py-3">
              <Text className="text-center text-[14px] font-bold leading-5 text-[#FF8A8A]">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="mt-8 gap-3">
            <Pressable
              accessibilityRole="button"
              className={`h-14 flex-row items-center justify-center rounded-full ${
                isLoading ? "bg-[#6C629F]" : "bg-[#A594F7] active:opacity-80"
              }`}
              disabled={isLoading}
              onPress={handleContinue}
            >
              <Text className="text-[16px] font-extrabold tracking-normal text-[#151515]">
                {isLoading ? "Opening Google..." : "Continue with Google"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full active:opacity-70"
              disabled={isLoading}
              onPress={onClose}
            >
              <Text className="text-[14px] font-bold text-[#A6A6A6]">
                Choose another option
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
