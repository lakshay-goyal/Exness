declare const require: (moduleName: string) => unknown;

import { logAuthEvent } from "./auth-logger";

type SecureStoreModule = {
  getItem?: (key: string) => string | null;
  setItem?: (key: string, value: string) => void;
  setItemAsync?: (key: string, value: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

let secureStore: SecureStoreModule | null | undefined;
let didLogSecureStoreFallback = false;

function getSecureStore() {
  if (secureStore !== undefined) {
    return secureStore;
  }

  try {
    secureStore = require("expo-secure-store") as SecureStoreModule;
  } catch {
    secureStore = null;
    if (!didLogSecureStoreFallback) {
      logAuthEvent(
        "secure_store_unavailable",
        {
          storageFallback: "web_or_memory",
        },
        "warn",
      );
      didLogSecureStoreFallback = true;
    }
  }

  return secureStore;
}

function getWebStorageItem(key: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setWebStorageItem(key: string, value: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  window.localStorage.setItem(key, value);
  return true;
}

export const authStorage = {
  getItem(key: string) {
    const store = getSecureStore();

    if (store?.getItem) {
      try {
        return store.getItem(key);
      } catch {
        logAuthEvent(
          "secure_store_get_failed",
          {
            key,
            storageFallback: "web_or_memory",
          },
          "warn",
        );
        // Fall back below when the current dev client lacks the native module.
      }
    }

    return getWebStorageItem(key) ?? memoryStore.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    const store = getSecureStore();

    if (store?.setItem) {
      try {
        store.setItem(key, value);
        return;
      } catch {
        logAuthEvent(
          "secure_store_set_failed",
          {
            key,
            storageFallback: "web_or_memory",
          },
          "warn",
        );
        // Fall back below when the current dev client lacks the native module.
      }
    }

    if (!setWebStorageItem(key, value)) {
      memoryStore.set(key, value);
    }
  },
};

export async function setStoredAuthItem(key: string, value: string) {
  const store = getSecureStore();

  if (store?.setItemAsync) {
    try {
      await store.setItemAsync(key, value);
      return;
    } catch {
      logAuthEvent(
        "secure_store_set_async_failed",
        {
          key,
          storageFallback: "sync_or_memory",
        },
        "warn",
      );
      // Fall back to sync storage below.
    }
  }

  authStorage.setItem(key, value);
}
