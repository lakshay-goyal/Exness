type AuthLogLevel = "info" | "warn" | "error";

type AuthLogDetails = Record<
  string,
  boolean | number | string | null | undefined
>;

const isAuthLoggingEnabled =
  process.env.EXPO_PUBLIC_AUTH_LOGS === "true" ||
  (typeof __DEV__ !== "undefined" && __DEV__);

function cleanDetails(details?: AuthLogDetails) {
  if (!details) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  );
}

export function logAuthEvent(
  event: string,
  details?: AuthLogDetails,
  level: AuthLogLevel = "info",
) {
  if (!isAuthLoggingEnabled) {
    return;
  }

  const payload = cleanDetails(details);
  const message = `[mobile-auth] ${event}`;

  if (level === "error") {
    console.error(message, payload ?? "");
    return;
  }

  if (level === "warn") {
    console.warn(message, payload ?? "");
    return;
  }

  console.info(message, payload ?? "");
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getAuthClientErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      error: typeof error === "string" ? error : undefined,
    };
  }

  const authError = error as Record<string, unknown>;

  return {
    error:
      typeof authError.message === "string"
        ? authError.message
        : typeof authError.error === "string"
          ? authError.error
          : undefined,
    code: typeof authError.code === "string" ? authError.code : undefined,
    status:
      typeof authError.status === "number"
        ? authError.status
        : typeof authError.statusCode === "number"
          ? authError.statusCode
          : undefined,
    statusText:
      typeof authError.statusText === "string"
        ? authError.statusText
        : undefined,
  };
}
