import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

import { authStorage } from "./auth-storage";

export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const authClient = createAuthClient({
  baseURL: BACKEND_URL,
  plugins: [
    expoClient({
      scheme: "mobile",
      storagePrefix: "exness",
      storage: authStorage,
    }),
  ],
});
