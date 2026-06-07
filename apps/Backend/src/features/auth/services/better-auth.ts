import { expo } from "@better-auth/expo";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@repo/db";
import { config } from "@repo/config";
import { betterAuth } from "better-auth";

import { ensureTradingUser } from "./trading-user.js";

export const auth = betterAuth({
  appName: "Exness",
  baseURL: config.BACKEND_URL,
  basePath: "/api/auth",
  secret: config.BETTER_AUTH_SECRET || config.JWT_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [expo()],
  trustedOrigins: [
    config.FRONTEND_URL,
    config.BACKEND_URL,
    "mobile://",
    "mobile://*",
    ...(config.NODE_ENV === "development"
      ? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
      : []),
  ],
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID || "",
      clientSecret: config.GOOGLE_CLIENT_SECRET || "",
    },
  },
  user: {
    modelName: "authUser",
    additionalFields: {
      mobilePinHash: {
        type: "string",
        required: false,
        returned: false,
      },
      mobilePinSetAt: {
        type: "date",
        required: false,
        returned: false,
      },
    },
  },
  session: {
    modelName: "authSession",
  },
  account: {
    modelName: "authAccount",
  },
  verification: {
    modelName: "authVerification",
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureTradingUser(user.id, user.email);
        },
      },
    },
  },
});
