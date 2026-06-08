import { Platform, TurboModuleRegistry } from 'react-native';

type KeyboardControllerPackage = typeof import('react-native-keyboard-controller');

declare const require: (moduleName: string) => KeyboardControllerPackage;

let cachedKeyboardController: KeyboardControllerPackage | null | undefined;
let didWarnKeyboardControllerUnavailable = false;

export function getKeyboardControllerPackage() {
  if (cachedKeyboardController !== undefined) {
    return cachedKeyboardController;
  }

  const isNativeModuleAvailable =
    Platform.OS === 'web' || Boolean(TurboModuleRegistry.get('KeyboardController'));

  if (!isNativeModuleAvailable) {
    cachedKeyboardController = null;

    if (process.env.NODE_ENV !== 'production' && !didWarnKeyboardControllerUnavailable) {
      didWarnKeyboardControllerUnavailable = true;
      console.warn(
        'Keyboard controller native module is not available in this app binary. Rebuild the native app after installing react-native-keyboard-controller.',
      );
    }

    return cachedKeyboardController;
  }

  try {
    cachedKeyboardController = require('react-native-keyboard-controller');
  } catch (error) {
    cachedKeyboardController = null;

    if (process.env.NODE_ENV !== 'production' && !didWarnKeyboardControllerUnavailable) {
      didWarnKeyboardControllerUnavailable = true;
      console.warn('Unable to load keyboard controller.', error);
    }
  }

  return cachedKeyboardController;
}
