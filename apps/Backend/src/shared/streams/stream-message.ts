export function parseStreamMessage<T>(message: unknown, fallback: T): T {
  if (typeof message !== "string") return (message as T) ?? fallback;

  try {
    return JSON.parse(message) as T;
  } catch {
    return fallback;
  }
}
