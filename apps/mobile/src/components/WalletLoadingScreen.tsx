import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

type WalletLoadingScreenProps = {
  onComplete: () => void;
};

function LoadingDots() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View className="h-8 flex-row items-center justify-center gap-2">
      {[0, 1, 2].map((index) => {
        const translateY = progress.interpolate({
          inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
          outputRange:
            index === 0
              ? [0, -7, 0, 0, 0, 0]
              : index === 1
                ? [0, 0, -7, 0, 0, 0]
                : [0, 0, 0, -7, 0, 0],
        });

        return (
          <Animated.View
            key={index}
            className="h-2.5 w-2.5 rounded-full bg-[#A594F7]"
            style={{ transform: [{ translateY }] }}
          />
        );
      })}
    </View>
  );
}

export function WalletLoadingScreen({ onComplete }: WalletLoadingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View className="flex-1 bg-[#1B1B1B]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7 pb-12">
          <View className="flex-1" />
          <View className="items-center">
            <LoadingDots />
            <Text className="mt-20 text-center text-[28px] font-black tracking-normal text-white">
              Creating wallet
            </Text>
            <Text className="mt-2 text-center text-[15px] leading-5 text-[#8E8E8E]">
              Adding a social wallet
            </Text>
          </View>
          <View className="flex-[0.82]" />
        </View>
      </SafeAreaView>
    </View>
  );
}
