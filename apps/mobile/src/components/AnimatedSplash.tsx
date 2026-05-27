import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

type AnimatedSplashProps = {
  visible: boolean;
  onFinish: () => void;
};

export function AnimatedSplash({ visible, onFinish }: AnimatedSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

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

    pulseLoop.start();

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
      clearTimeout(finishTimer);
    };
  }, [onFinish, opacity, pulse, visible]);

  if (!visible) {
    return null;
  }

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.container, { opacity }]}
    >
      <Animated.View
        style={[styles.logoWrap, { transform: [{ scale: ringScale }] }]}
      >
        <Svg width={170} height={170} viewBox="0 0 16 16" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z"
            fill="#FFFFFF"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "#000000",
    justifyContent: "center",
    zIndex: 20,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
