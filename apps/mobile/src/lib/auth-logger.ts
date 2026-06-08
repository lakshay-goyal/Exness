type AuthLogLevel = 'info' | 'warn' | 'error';

type AuthLogDetails = Record<string, boolean | number | string | null | undefined>;

const isAuthLoggingEnabled =
  process.env.EXPO_PUBLIC_AUTH_LOGS === 'true' || (typeof __DEV__ !== 'undefined' && __DEV__);

function cleanDetails(details?: AuthLogDetails) {
  if (!details) {
    return undefined;
  }

  return Object.fromEntries(Object.entries(details).filter(([, value]) => value !== undefined));
}

export function logAuthEvent(
  event: string,
  details?: AuthLogDetails,
  level: AuthLogLevel = 'info',
) {
  if (!isAuthLoggingEnabled) {
    return;
  }

  const payload = cleanDetails(details);
  const message = `[mobile-auth] ${event}`;

  if (level === 'error') {
    console.error(message, payload ?? '');
    return;
  }

  if (level === 'warn') {
    console.warn(message, payload ?? '');
    return;
  }

  console.info(message, payload ?? '');
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
