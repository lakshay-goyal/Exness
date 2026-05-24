import { setStoredAuthItem } from "./auth-storage";
import { logAuthEvent } from "./auth-logger";

declare const require: (moduleName: string) => unknown;

export type BiometricKind = "face" | "fingerprint" | "iris" | "biometric";

export type BiometricAvailability = {
  isAvailable: boolean;
  kind: BiometricKind;
  title: string;
  subtitle: string;
  prompt: string;
};

const BIOMETRIC_ENABLED_KEY = "exness_biometric_enabled";

const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
} as const;

type LocalAuthenticationResult =
  | { success: true }
  | { success: false; error?: string };

type LocalAuthenticationModule = {
  hasHardwareAsync: () => Promise<boolean>;
  isEnrolledAsync: () => Promise<boolean>;
  supportedAuthenticationTypesAsync: () => Promise<number[]>;
  authenticateAsync: (options: {
    promptMessage?: string;
    promptSubtitle?: string;
    promptDescription?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
    biometricsSecurityLevel?: "weak" | "strong";
  }) => Promise<LocalAuthenticationResult>;
};

let localAuthentication: LocalAuthenticationModule | null | undefined;
let didLogMissingModule = false;

function getLocalAuthentication() {
  if (localAuthentication !== undefined) {
    return localAuthentication;
  }

  try {
    localAuthentication =
      require("expo-local-authentication") as LocalAuthenticationModule;
  } catch (err) {
    localAuthentication = null;

    if (!didLogMissingModule) {
      logAuthEvent(
        "local_authentication_module_unavailable",
        {
          error: err instanceof Error ? err.message : String(err),
        },
        "warn",
      );
      didLogMissingModule = true;
    }
  }

  return localAuthentication;
}

function getBiometricCopy(
  types: number[],
): Omit<BiometricAvailability, "isAvailable"> {
  if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
    return {
      kind: "face",
      title: "Face ID",
      subtitle: "Use Face ID Authentication",
      prompt: "Allow Face ID to protect your wallet",
    };
  }

  if (types.includes(AuthenticationType.FINGERPRINT)) {
    return {
      kind: "fingerprint",
      title: "Fingerprint",
      subtitle: "Use Fingerprint Authentication",
      prompt: "Allow fingerprint to protect your wallet",
    };
  }

  if (types.includes(AuthenticationType.IRIS)) {
    return {
      kind: "iris",
      title: "Iris unlock",
      subtitle: "Use Iris Authentication",
      prompt: "Allow iris unlock to protect your wallet",
    };
  }

  return {
    kind: "biometric",
    title: "Biometrics",
    subtitle: "Use Biometric Authentication",
    prompt: "Allow biometrics to protect your wallet",
  };
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const LocalAuthentication = getLocalAuthentication();

  if (!LocalAuthentication) {
    return {
      isAvailable: false,
      kind: "biometric",
      title: "Biometrics",
      subtitle: "Use Biometric Authentication",
      prompt: "Allow biometrics to protect your wallet",
    };
  }

  try {
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const copy = getBiometricCopy(supportedTypes);
    const isAvailable = hasHardware && isEnrolled && supportedTypes.length > 0;

    logAuthEvent("biometric_availability_checked", {
      hasHardware,
      isEnrolled,
      supportedTypes: supportedTypes.join(","),
      kind: copy.kind,
      isAvailable,
    });

    return {
      isAvailable,
      ...copy,
    };
  } catch (err) {
    logAuthEvent(
      "biometric_availability_check_failed",
      {
        error: err instanceof Error ? err.message : String(err),
      },
      "warn",
    );

    return {
      isAvailable: false,
      kind: "biometric",
      title: "Biometrics",
      subtitle: "Use Biometric Authentication",
      prompt: "Allow biometrics to protect your wallet",
    };
  }
}

export async function enableBiometricAuthentication(
  availability: BiometricAvailability,
) {
  const LocalAuthentication = getLocalAuthentication();

  if (!LocalAuthentication) {
    return {
      success: false,
      error: "not_available",
    } as const;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: availability.prompt,
    promptSubtitle: "Confirm it is you",
    promptDescription: "This lets Exness unlock your wallet faster next time.",
    cancelLabel: "Not now",
    fallbackLabel: "",
    disableDeviceFallback: true,
    biometricsSecurityLevel: "weak",
  });

  logAuthEvent("biometric_authentication_finished", {
    success: result.success,
    kind: availability.kind,
    error: result.success ? undefined : result.error,
  });

  if (result.success) {
    await setStoredAuthItem(BIOMETRIC_ENABLED_KEY, availability.kind);
  }

  return result;
}
