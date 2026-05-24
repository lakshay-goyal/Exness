import { useEffect, useRef } from "react";
import { Animated, Easing, Text } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type AnimatedSplashProps = {
  visible: boolean;
  onFinish: () => void;
};

export function AnimatedSplash({ visible, onFinish }: AnimatedSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    driftLoop.start();

    const finishTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onFinish();
        }
      });
    }, 1450);

    return () => {
      pulseLoop.stop();
      driftLoop.stop();
      clearTimeout(finishTimer);
    };
  }, [drift, onFinish, opacity, pulse, visible]);

  if (!visible) {
    return null;
  }

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const markTranslate = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  return (
    <Animated.View
      className="absolute inset-0 z-20 items-center justify-center bg-black"
      style={{ opacity }}
    >
      <Animated.View
        className="items-center justify-center"
        style={{
          transform: [{ scale: ringScale }],
        }}
      >
        <Svg width={180} height={180} viewBox="0 0 180 180" fill="none">
          <Circle
            cx="90"
            cy="90"
            r="66"
            stroke="#FFFFFF"
            strokeOpacity="0.9"
            strokeWidth="2"
          />
          <Circle
            cx="90"
            cy="90"
            r="42"
            stroke="#FFFFFF"
            strokeOpacity="0.42"
            strokeWidth="14"
          />
          <Path
            d="M63 93C75 113 105 113 117 93"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <Path
            d="M57 70C64 78 73 78 80 70"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <Path
            d="M100 70C107 78 116 78 123 70"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        className="mt-[18px] rounded-full border border-white px-[22px] py-[9px]"
        style={{
          transform: [{ translateY: markTranslate }],
        }}
      >
        <Text className="text-[13px] font-extrabold tracking-normal text-white">
          MOOD
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
