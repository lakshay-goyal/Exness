import { getStoredAuthItem, setStoredAuthItem } from "./auth-storage";
import { authClient, BACKEND_URL } from "./auth-client";
import { logAuthEvent } from "./auth-logger";

const ACCESS_TOKEN_KEY = "exness_access_token";
const REFRESH_TOKEN_KEY = "exness_refresh_token";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "exness_access_token_expires_at";
const MOBILE_USER_KEY = "exness_mobile_user";
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60 * 1000;

export type MobileSessionResponse = {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    hasMobilePin: boolean;
  };
};

function getAuthCookie() {
  return authClient.getCookie();
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const decodeBase64 =
      typeof globalThis.atob === "function" ? globalThis.atob : null;

    if (!decodeBase64) {
      return null;
    }

    return JSON.parse(decodeBase64(paddedPayload)) as {
      userId?: string;
      email?: string;
      exp?: number;
      type?: string;
    };
  } catch {
    return null;
  }
}

function getAccessTokenExpiresAt(token: string, expiresIn?: number) {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    return Date.now() + expiresIn * 1000;
  }

  const payload = decodeJwtPayload(token);

  if (typeof payload?.exp === "number") {
    return payload.exp * 1000;
  }

  return Date.now() + 60 * 60 * 24 * 7 * 1000;
}

async function storeMobileSession(data: MobileSessionResponse) {
  const accessToken = data.accessToken || data.token;
  const accessTokenExpiresAt = getAccessTokenExpiresAt(
    accessToken,
    data.accessTokenExpiresIn,
  );
  const writes = [
    setStoredAuthItem("exness_legacy_token", accessToken),
    setStoredAuthItem(ACCESS_TOKEN_KEY, accessToken),
    setStoredAuthItem(
      ACCESS_TOKEN_EXPIRES_AT_KEY,
      String(accessTokenExpiresAt),
    ),
    setStoredAuthItem(MOBILE_USER_KEY, JSON.stringify(data.user)),
  ];

  if (data.refreshToken) {
    writes.push(setStoredAuthItem(REFRESH_TOKEN_KEY, data.refreshToken));
  }

  await Promise.all(writes);
}

export async function syncMobileSession() {
  const url = `${BACKEND_URL}/api/v1/auth/mobile/session-token`;
  const authCookie = getAuthCookie();

  logAuthEvent("session_sync_requested", {
    url,
    hasAuthCookie: Boolean(authCookie),
  });

  const response = await fetch(url, {
    credentials: "omit",
    headers: {
      Cookie: authCookie,
    },
  });

  if (!response.ok) {
    logAuthEvent(
      "session_sync_failed",
      {
        status: response.status,
        statusText: response.statusText,
      },
      "error",
    );
    throw new Error("Unable to sync mobile session");
  }

  const data = (await response.json()) as MobileSessionResponse;
  await storeMobileSession(data);
  logAuthEvent("session_sync_succeeded", {
    userId: data.user.id,
    email: data.user.email,
    hasMobilePin: data.user.hasMobilePin,
  });
  return data;
}

export async function refreshMobileSession(refreshToken: string) {
  const url = `${BACKEND_URL}/api/v1/auth/mobile/refresh-token`;

  logAuthEvent("session_refresh_requested", {
    url,
    hasRefreshToken: Boolean(refreshToken),
  });

  const response = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    logAuthEvent(
      "session_refresh_failed",
      {
        status: response.status,
        statusText: response.statusText,
      },
      "warn",
    );
    throw new Error("Unable to refresh mobile session");
  }

  const data = (await response.json()) as MobileSessionResponse;
  await storeMobileSession(data);
  logAuthEvent("session_refresh_succeeded", {
    userId: data.user.id,
    email: data.user.email,
    hasMobilePin: data.user.hasMobilePin,
  });

  return data;
}

export async function restoreMobileSession() {
  const [storedUser, accessToken, legacyToken, refreshToken, expiresAtValue] =
    await Promise.all([
      getStoredAuthItem(MOBILE_USER_KEY),
      getStoredAuthItem(ACCESS_TOKEN_KEY),
      getStoredAuthItem("exness_legacy_token"),
      getStoredAuthItem(REFRESH_TOKEN_KEY),
      getStoredAuthItem(ACCESS_TOKEN_EXPIRES_AT_KEY),
    ]);
  const storedAccessToken = accessToken || legacyToken;

  if (!storedAccessToken && !refreshToken) {
    logAuthEvent("session_restore_skipped", {
      hasStoredUser: Boolean(storedUser),
      hasAccessToken: Boolean(storedAccessToken),
      hasLegacyToken: Boolean(legacyToken),
      hasRefreshToken: Boolean(refreshToken),
    });
    return null;
  }

  const expiresAt = Number(expiresAtValue);
  const hasValidAccessToken =
    typeof storedAccessToken === "string" &&
    ((Number.isFinite(expiresAt) &&
      Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS < expiresAt) ||
      (() => {
        const payload = decodeJwtPayload(storedAccessToken);
        return (
          payload?.type !== "refresh" &&
          (typeof payload?.exp !== "number" ||
            Date.now() + ACCESS_TOKEN_REFRESH_WINDOW_MS < payload.exp * 1000)
        );
      })());

  if (hasValidAccessToken) {
    try {
      const decodedPayload = decodeJwtPayload(storedAccessToken);
      const user = storedUser
        ? (JSON.parse(storedUser) as MobileSessionResponse["user"])
        : {
            id: decodedPayload?.userId || "",
            email: decodedPayload?.email || "",
            name: decodedPayload?.email || "Authenticated user",
            image: null,
            hasMobilePin: false,
          };
      logAuthEvent("session_restore_succeeded", {
        userId: user.id,
        email: user.email,
        source: accessToken ? "stored_access_token" : "legacy_token",
      });
      return {
        token: storedAccessToken,
        accessToken: storedAccessToken,
        refreshToken: refreshToken || undefined,
        accessTokenExpiresIn: Number.isFinite(expiresAt)
          ? Math.floor((expiresAt - Date.now()) / 1000)
          : 0,
        refreshTokenExpiresIn: 0,
        user,
      } satisfies MobileSessionResponse;
    } catch {
      logAuthEvent("session_restore_user_parse_failed", undefined, "warn");
    }
  }

  if (refreshToken) {
    return refreshMobileSession(refreshToken);
  }

  return null;
}

export async function setMobilePin(pin: string) {
  const url = `${BACKEND_URL}/api/v1/auth/mobile/pin`;
  const authCookie = getAuthCookie();

  logAuthEvent("pin_save_requested", {
    url,
    pinLength: pin.length,
    hasAuthCookie: Boolean(authCookie),
  });

  const response = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    logAuthEvent(
      "pin_save_failed",
      {
        status: response.status,
        statusText: response.statusText,
        error: body?.error,
      },
      "error",
    );
    throw new Error(body?.error || "Unable to save PIN");
  }

  const data = (await response.json()) as {
    success: boolean;
    hasMobilePin: boolean;
  };

  logAuthEvent("pin_save_succeeded", {
    success: data.success,
    hasMobilePin: data.hasMobilePin,
  });

  return data;
}
