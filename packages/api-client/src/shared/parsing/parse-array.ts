export function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}
