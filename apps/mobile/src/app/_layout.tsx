import '../global.css';
import 'react-native-ease/nativewind';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { PressablesConfig } from 'pressto';
import { ReactNode, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getKeyboardControllerPackage } from '@/lib/keyboard-controller';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 700,
  fade: true,
});

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#ffffff');
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PressablesConfig
        animationConfig={{ damping: 24, mass: 0.7, stiffness: 320 }}
        animationType="spring"
        config={{ activeOpacity: 0.86, minScale: 0.975 }}
        defaultProps={{ rippleColor: 'transparent' }}
      >
        <SafeAreaProvider>
          <KeyboardControllerProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </KeyboardControllerProvider>
        </SafeAreaProvider>
      </PressablesConfig>
    </GestureHandlerRootView>
  );
}

function KeyboardControllerProvider({ children }: { children: ReactNode }) {
  const KeyboardProvider = getKeyboardControllerPackage()?.KeyboardProvider;

  if (!KeyboardProvider) {
    return <>{children}</>;
  }

  return <KeyboardProvider>{children}</KeyboardProvider>;
}
