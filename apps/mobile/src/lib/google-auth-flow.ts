import { getCookie, getSetCookie } from '@better-auth/expo/client';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { authStorage } from './auth-storage';
import { BACKEND_URL } from './auth-client';
import { logAuthEvent } from './auth-logger';

const AUTH_COOKIE_KEY = 'exness_cookie';
const COOKIE_PREFIX = 'better-auth';

type SocialSignInResponse = {
  redirect?: boolean;
  url?: string;
};

type StoredCookie = Record<
  string,
  {
    value?: string;
    expires?: string | null;
  }
>;

function getStoredCookieJson() {
  return authStorage.getItem(AUTH_COOKIE_KEY) || '{}';
}

function getAuthCookieHeader() {
  return getCookie(getStoredCookieJson());
}

function saveSetCookieHeader(setCookie: string | null) {
  if (!setCookie) {
    return;
  }

  const nextCookie = getSetCookie(setCookie, getStoredCookieJson());
  authStorage.setItem(AUTH_COOKIE_KEY, nextCookie);
}

function getOAuthStateValue() {
  const rawCookie = getStoredCookieJson();

  try {
    const cookies = JSON.parse(rawCookie) as StoredCookie;
    const names = [`__Secure-${COOKIE_PREFIX}.oauth_state`, `${COOKIE_PREFIX}.oauth_state`];

    for (const name of names) {
      const value = cookies[name]?.value;

      if (value) {
        return value;
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function readErrorBody(response: Response) {
  const body = await response.text().catch(() => '');

  if (!body) {
    return response.statusText || 'Google authentication failed.';
  }

  try {
    const data = JSON.parse(body) as { message?: string; error?: string };
    return data.message || data.error || body;
  } catch {
    return body;
  }
}

export async function signInWithGoogleInBrowser() {
  const callbackURL = Linking.createURL('/', { scheme: 'mobile' });
  const expoOrigin = Linking.createURL('', { scheme: 'mobile' });

  logAuthEvent('google_browser_auth_requested', {
    callbackURL,
    expoOrigin,
    backendURL: BACKEND_URL,
  });

  const response = await fetch(`${BACKEND_URL}/api/auth/sign-in/social`, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      Cookie: getAuthCookieHeader(),
      'expo-origin': expoOrigin,
      'x-skip-oauth-proxy': 'true',
    },
    body: JSON.stringify({
      provider: 'google',
      callbackURL,
    }),
  });

  saveSetCookieHeader(response.headers.get('set-cookie'));

  if (!response.ok) {
    const message = await readErrorBody(response);

    logAuthEvent(
      'google_browser_auth_url_failed',
      {
        status: response.status,
        statusText: response.statusText,
        error: message,
      },
      'error',
    );

    throw new Error(message);
  }

  const data = (await response.json()) as SocialSignInResponse;

  if (!data.redirect || !data.url) {
    logAuthEvent(
      'google_browser_auth_url_missing',
      {
        redirect: Boolean(data.redirect),
        hasURL: Boolean(data.url),
      },
      'error',
    );

    throw new Error('Google did not return an authorization URL.');
  }

  if (typeof WebBrowser.openAuthSessionAsync !== 'function') {
    throw new Error(
      'Expo WebBrowser is unavailable in this dev build. Rebuild the iOS dev client with `bun run ios`.',
    );
  }

  if (Platform.OS === 'android') {
    WebBrowser.dismissAuthSession();
  }

  const params = new URLSearchParams({
    authorizationURL: data.url,
  });
  const oauthState = getOAuthStateValue();

  if (oauthState) {
    params.append('oauthState', oauthState);
  }

  const proxyURL = `${BACKEND_URL}/api/auth/expo-authorization-proxy?${params.toString()}`;

  logAuthEvent('google_browser_auth_opened', {
    callbackURL,
    hasOAuthState: Boolean(oauthState),
  });

  const result = await WebBrowser.openAuthSessionAsync(proxyURL, callbackURL);

  if (result.type !== 'success') {
    logAuthEvent(
      'google_browser_auth_cancelled',
      {
        type: result.type,
      },
      'warn',
    );

    throw new Error('Google authentication was cancelled.');
  }

  const cookie = new URL(result.url).searchParams.get('cookie');

  if (!cookie) {
    logAuthEvent('google_browser_auth_cookie_missing', undefined, 'error');
    throw new Error('Google authentication did not return a session cookie.');
  }

  saveSetCookieHeader(cookie);
  logAuthEvent('google_browser_auth_cookie_saved');
}
