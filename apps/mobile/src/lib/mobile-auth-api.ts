import { setStoredAuthItem } from "./auth-storage";
import { authClient, BACKEND_URL } from "./auth-client";
import { logAuthEvent } from "./auth-logger";

export type MobileSessionResponse = {
  token: string;
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
  await setStoredAuthItem("exness_legacy_token", data.token);
  logAuthEvent("session_sync_succeeded", {
    userId: data.user.id,
    email: data.user.email,
    hasMobilePin: data.user.hasMobilePin,
  });
  return data;
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
