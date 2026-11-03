const cache = new Map<string, { value: unknown; expiresAt: number }>();
const maxEntries = 500;

export const getCacheValue = <T>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
};

export const setCacheValue = (
  key: string,
  value: unknown,
  ttlMs = 60_000,
): void => {
  cache.delete(key);
  if (cache.size >= maxEntries) cache.delete(cache.keys().next().value!);
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const deleteCacheValue = (key: string): void => {
  cache.delete(key);
};
