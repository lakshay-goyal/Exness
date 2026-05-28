import { Platform, TurboModuleRegistry, Vibration } from "react-native";

type PulsarPresets = (typeof import("react-native-pulsar"))["Presets"];

declare const require: (moduleName: string) => {
  Presets: PulsarPresets;
};

let cachedPresets: PulsarPresets | null | undefined;
let didWarnUnavailable = false;
let didWarnFallback = false;

function getPulsarPresets() {
  if (Platform.OS === "web") {
    return null;
  }

  if (cachedPresets !== undefined) {
    return cachedPresets;
  }

  if (!TurboModuleRegistry.get("RNPulsar")) {
    cachedPresets = null;

    if (process.env.NODE_ENV !== "production" && !didWarnUnavailable) {
      didWarnUnavailable = true;
      console.warn(
        "Pulsar native module is not available in this app binary. Rebuild the native app after installing react-native-pulsar.",
      );
    }

    return cachedPresets;
  }

  try {
    cachedPresets = require("react-native-pulsar").Presets;
  } catch (error) {
    cachedPresets = null;

    if (process.env.NODE_ENV !== "production" && !didWarnUnavailable) {
      didWarnUnavailable = true;
      console.warn("Unable to load Pulsar haptics.", error);
    }
  }

  return cachedPresets;
}

function playFallbackVibration(androidPattern: number[]) {
  if (Platform.OS === "web") {
    return;
  }

  if (Platform.OS === "ios") {
    Vibration.vibrate();
  } else {
    Vibration.vibrate(androidPattern);
  }

  if (process.env.NODE_ENV !== "production" && !didWarnFallback) {
    didWarnFallback = true;
    console.warn(
      "Using React Native vibration fallback until Pulsar is available in the native app binary.",
    );
  }
}

function playHaptic(
  effect: (presets: PulsarPresets) => void,
  fallbackPattern: number[],
) {
  const presets = getPulsarPresets();

  if (!presets) {
    playFallbackVibration(fallbackPattern);
    return;
  }

  try {
    effect(presets);
  } catch (error) {
    playFallbackVibration(fallbackPattern);

    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to play Pulsar haptic feedback.", error);
    }
  }
}

export function playTradePlacedHaptic() {
  playHaptic(
    (presets) => {
      presets.System.impactLight();
    },
    [0, 20],
  );
}

export function playTradeClosedHaptic() {
  playHaptic(
    (presets) => {
      presets.System.selection();
    },
    [0, 15],
  );
}

export function playSubtleTapHaptic() {
  playHaptic(
    (presets) => {
      presets.System.selection();
    },
    [0, 12],
  );
}
