import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScaleMotion } from '@/components/PressMotion';
import { getAuthErrorMessage, logAuthEvent } from '@/lib/auth-logger';
import { setMobilePin } from '@/lib/mobile-auth-api';

type CreatePinScreenProps = {
  onBack: () => void;
  onComplete: () => void;
};

export function CreatePinScreen({ onBack, onComplete }: CreatePinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canContinue = /^\d{4,6}$/.test(pin) && !isSaving;

  async function handleContinue() {
    if (!canContinue) {
      logAuthEvent(
        'pin_continue_blocked',
        {
          pinLength: pin.length,
        },
        'warn',
      );
      setError('Enter a 4 to 6 digit PIN.');
      return;
    }

    setIsSaving(true);
    setError('');
    logAuthEvent('pin_continue_pressed', {
      pinLength: pin.length,
    });

    try {
      await setMobilePin(pin);
      logAuthEvent('pin_flow_save_completed');
      onComplete();
    } catch (err) {
      const message = getAuthErrorMessage(err, 'Unable to save PIN');
      logAuthEvent(
        'pin_flow_save_failed',
        {
          error: message,
        },
        'error',
      );
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-[#1B1B1B]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7 pb-6 pt-5">
          <View className="h-10 flex-row items-center justify-between">
            <PressableScaleMotion
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-10 w-10 items-start justify-center"
              onPress={onBack}
            >
              <Text className="text-[32px] leading-9 text-white">‹</Text>
            </PressableScaleMotion>

            <View className="flex-row gap-1.5">
              <View className="h-1 w-4 rounded-full bg-[#A594F7]" />
              <View className="h-1 w-1.5 rounded-full bg-[#504A68]" />
              <View className="h-1 w-1.5 rounded-full bg-[#504A68]" />
              <View className="h-1 w-1.5 rounded-full bg-[#504A68]" />
            </View>

            <View className="h-10 w-10" />
          </View>

          <View className="mt-8 items-center">
            <Text className="text-center text-[31px] font-black tracking-normal text-white">
              Create a PIN
            </Text>
            <Text className="mt-3 max-w-[330px] text-center text-[16px] leading-6 text-[#9A9A9A]">
              This secures access to your trading account on this device.{' '}
              <Text className="font-extrabold text-[#E2C856]">This cannot be recovered.</Text>
            </Text>
          </View>

          <TextInput
            accessibilityLabel="Create PIN"
            className="mt-9 h-[68px] rounded-2xl bg-[#2A2A2A] px-6 text-center text-[26px] font-black tracking-[10px] text-white"
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            value={pin}
            onChangeText={(value) => {
              setPin(value.replace(/\D/g, ''));
              setError('');
            }}
          />

          {error ? (
            <Text className="mt-3 text-center text-[14px] font-bold text-[#FF7A7A]">{error}</Text>
          ) : null}

          <View className="flex-1" />

          <PressableScaleMotion
            accessibilityRole="button"
            className={`h-[54px] items-center justify-center rounded-full ${
              canContinue ? 'bg-[#A594F7]' : 'bg-[#5F5A83]'
            }`}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            <Text className="text-[17px] font-extrabold tracking-normal text-[#151515]">
              {isSaving ? 'Saving...' : 'Continue'}
            </Text>
          </PressableScaleMotion>
        </View>
      </SafeAreaView>
    </View>
  );
}
