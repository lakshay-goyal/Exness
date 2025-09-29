import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const envSchema = z.object({
  REDIS_URL: z.string(),
  BINANCE_WS_URL: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number),
  DB_NAME: z.string(),
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
  DB_USER: env.DB_USER,
  DB_PASSWORD: env.DB_PASSWORD,
  DB_HOST: env.DB_HOST,
  DB_PORT: env.DB_PORT,
  DB_NAME: env.DB_NAME,
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