import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { AnimatedSplash } from "@/components/AnimatedSplash";
import { MoodCharacters } from "@/components/MoodCharacters";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { height } = useWindowDimensions();

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style={showSplash ? "light" : "dark"} />
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
      <AnimatedSplash visible={showSplash} onFinish={handleSplashFinish} />
    </View>
  );
}
