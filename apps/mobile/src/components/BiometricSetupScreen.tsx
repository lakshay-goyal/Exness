import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { PressableScaleMotion } from '@/components/PressMotion';
import {
  BiometricAvailability,
  enableBiometricAuthentication,
  getBiometricAvailability,
} from '@/lib/biometric-auth';
import { logAuthEvent } from '@/lib/auth-logger';

type BiometricSetupScreenProps = {
  onComplete: () => void;
};

function LockIllustration() {
  return (
    <Svg width={210} height={220} viewBox="0 0 210 220" fill="none">
      <G opacity="0.32">
        <Path
          d="M50 74C72 45 89 91 109 68C128 46 148 79 169 58"
          stroke="#2B2B2B"
          strokeWidth="34"
          strokeLinecap="round"
        />
        <Path
          d="M44 122C74 101 94 145 119 119C140 97 152 147 178 125"
          stroke="#2B2B2B"
          strokeWidth="23"
          strokeLinecap="round"
        />
      </G>
      <Path
        d="M70 94V64C70 37 88 18 113 18C138 18 156 37 156 64V78"
        stroke="#F0F0E9"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <Path
        d="M70 94V64C70 37 88 18 113 18C138 18 156 37 156 64V78"
        stroke="#B8B8B2"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <Rect x="58" y="92" width="116" height="94" rx="2" fill="#9F91EE" />
      <Rect x="58" y="92" width="42" height="94" fill="#382E59" />
      <Circle cx="116" cy="132" r="12" fill="#1B1B1B" />
      <Path d="M111 139H121L126 169H106L111 139Z" fill="#1B1B1B" />
      <Path d="M24 56L28 70L42 74L28 78L24 92L20 78L6 74L20 70L24 56Z" fill="#F3F6B3" />
      <Path
        d="M182 158L185 166L193 169L185 172L182 180L179 172L171 169L179 166L182 158Z"
        fill="#F3F6B3"
      />
      <Path
        d="M186 48C196 42 198 40 202 31"
        stroke="#8372D2"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <Path d="M196 64L213 58" stroke="#8372D2" strokeWidth="7" strokeLinecap="round" />
    </Svg>
  );
}

function BiometricIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Path d="M9 7.5V5.5H13" stroke="#DADADA" strokeWidth="1.7" strokeLinecap="round" />
      <Path d="M17 5.5H21V9.5" stroke="#DADADA" strokeWidth="1.7" strokeLinecap="round" />
      <Path d="M21 20.5V24.5H17" stroke="#DADADA" strokeWidth="1.7" strokeLinecap="round" />
      <Path d="M13 24.5H9V20.5" stroke="#DADADA" strokeWidth="1.7" strokeLinecap="round" />
      <Path
        d="M12 15C12 13.1 13.1 12 15 12C16.9 12 18 13.1 18 15"
        stroke="#DADADA"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <Path
        d="M11 18C12.5 20.2 17.5 20.2 19 18"
        stroke="#DADADA"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BiometricSetupScreen({ onComplete }: BiometricSetupScreenProps) {
  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    getBiometricAvailability().then((result) => {
      if (!isMounted) {
        return;
      }

      if (!result.isAvailable) {
        logAuthEvent('biometric_setup_skipped_unavailable', {
          kind: result.kind,
        });
        onComplete();
        return;
      }

      setAvailability(result);
    });

    return () => {
      isMounted = false;
    };
  }, [onComplete]);

  async function handleToggle() {
    if (!availability || isAuthenticating) {
      return;
    }

    if (isEnabled) {
      setIsEnabled(false);
      setMessage('');
      return;
    }

    setIsAuthenticating(true);
    setMessage('');
    logAuthEvent('biometric_opt_in_pressed', {
      kind: availability.kind,
    });

    try {
      const result = await enableBiometricAuthentication(availability);
      if (result.success) {
        setIsEnabled(true);
        setMessage(`${availability.title} enabled for this device.`);
      } else if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        setMessage(`${availability.title} was not enabled.`);
      } else {
        setMessage(`Unable to enable ${availability.title}. You can skip this.`);
      }
    } catch (err) {
      logAuthEvent(
        'biometric_opt_in_failed',
        {
          error: err instanceof Error ? err.message : String(err),
        },
        'warn',
      );
      setMessage(`Unable to enable ${availability.title}. You can skip this.`);
    } finally {
      setIsAuthenticating(false);
    }
  }

  if (!availability) {
    return (
      <View className="flex-1 bg-[#1B1B1B]">
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#1B1B1B]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7 pb-8 pt-5">
          <View className="h-10 flex-row items-center justify-end">
            <PressableScaleMotion
              accessibilityRole="button"
              className="h-10 items-center justify-center px-1"
              onPress={onComplete}
            >
              <Text className="text-[16px] font-extrabold text-white">Next</Text>
            </PressableScaleMotion>
          </View>

          <View className="mt-10 items-center">
            <LockIllustration />
            <Text className="mt-5 text-center text-[29px] font-black tracking-normal text-white">
              Protect your wallet
            </Text>
            <Text className="mt-5 max-w-[320px] text-center text-[16px] leading-6 text-[#9A9A9A]">
              Adding biometric security will ensure that you are the only one that can access your
              wallet.
            </Text>
          </View>

          <View className="mt-8 rounded-lg bg-[#2B2B2B] px-4 py-4">
            <PressableScaleMotion
              accessibilityRole="switch"
              accessibilityState={{
                checked: isEnabled,
                busy: isAuthenticating,
              }}
              className="flex-row items-center"
              onPress={handleToggle}
            >
              <BiometricIcon />
              <View className="ml-3 flex-1">
                <Text className="text-[17px] font-black tracking-normal text-white">
                  {availability.title}
                </Text>
                <Text className="mt-0.5 text-[13px] font-bold text-[#8F8F8F]">
                  {availability.subtitle}
                </Text>
              </View>
              <View
                className={`h-9 w-16 justify-center rounded-full px-1 ${
                  isEnabled ? 'items-end bg-[#8372D2]' : 'items-start bg-[#686868]'
                }`}
              >
                <View className="h-7 w-7 rounded-full bg-[#EDEDED]" />
              </View>
            </PressableScaleMotion>
          </View>

          {message ? (
            <Text className="mt-4 text-center text-[13px] font-bold text-[#AFAFAF]">{message}</Text>
          ) : null}

          <View className="flex-1" />

          <PressableScaleMotion
            accessibilityRole="button"
            className="h-[54px] items-center justify-center rounded-full bg-[#8E7EDD]"
            onPress={onComplete}
          >
            <Text className="text-[17px] font-extrabold tracking-normal text-[#151515]">Next</Text>
          </PressableScaleMotion>
        </View>
      </SafeAreaView>
    </View>
  );
}
