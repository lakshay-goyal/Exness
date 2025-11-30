import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

// Try to load .env file if it exists (for local development)
// In Docker, environment variables are set via docker-compose, so this is optional
const envPath = path.resolve(__dirname, "../../../../.env");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false }); // override: false means don't overwrite existing env vars
} else {
  // In Docker or if .env doesn't exist, rely on process.env (set by Docker)
  dotenv.config({ override: false });
}

const envSchema = z.object({
  REDIS_URL: z.string(),
  BINANCE_WS_URL: z.string(),
  TIMESCALE_DB_USER: z.string(),
  TIMESCALE_DB_PASSWORD: z.string(),
  TIMESCALE_DB_HOST: z.string(),
  TIMESCALE_DB_PORT: z.string().transform(Number),
  TIMESCALE_DB_NAME: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  PORT: z.string().transform(Number),
  FRONTEND_URL: z.string(),
  NODE_ENV: z.string(),
  USER_EMAIL: z.string(),
  USER_PASSWORD: z.string(),
  WEBSOCKET_PORT: z.string().transform(Number),
  BACKEND_URL: z.string(),
});

const env = envSchema.parse(process.env);

export const config = {
  REDIS_URL: env.REDIS_URL,
  BINANCE_WS_URL: env.BINANCE_WS_URL,
  TIMESCALE_DB_USER: env.TIMESCALE_DB_USER,
  TIMESCALE_DB_PASSWORD: env.TIMESCALE_DB_PASSWORD,
  TIMESCALE_DB_HOST: env.TIMESCALE_DB_HOST,
  TIMESCALE_DB_PORT: env.TIMESCALE_DB_PORT,
  TIMESCALE_DB_NAME: env.TIMESCALE_DB_NAME,
  DATABASE_URL: env.DATABASE_URL,
  JWT_SECRET: env.JWT_SECRET,
  PORT: env.PORT,
  FRONTEND_URL: env.FRONTEND_URL,
  NODE_ENV: env.NODE_ENV,
  USER_EMAIL: env.USER_EMAIL,
  USER_PASSWORD: env.USER_PASSWORD,
  WEBSOCKET_PORT: env.WEBSOCKET_PORT,
  BACKEND_URL: env.BACKEND_URL,
};

export default config;