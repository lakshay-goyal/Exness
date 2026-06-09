// ============================================
// HTTP Status Codes
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================
// HTTP Headers
// ============================================
export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  BEARER_PREFIX: 'Bearer ',
} as const;

// ============================================
// Content Types
// ============================================
export const CONTENT_TYPES = {
  JSON: 'application/json',
} as const;

// ============================================
// Token Types
// ============================================
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

// ============================================
// API Routes
// ============================================
export const API_ROUTES = {
  BASE: '/api/v1',
  AUTH_BASE: '/api/auth',
  AUTH: '/api/v1/auth',
  BALANCE: '/api/v1/balance',
  ASSETS: '/api/v1/supportedAssets',
  CANDLES: '/api/v1/candles',
  PRICES: '/api/v1/prices',
  TRADE: '/api/v1/trade',
} as const;

// ============================================
// Redis Stream Keys
// ============================================
export const REDIS_STREAMS = {
  EXNESS: 'stream:exness',
  EXNESS_RECEIVE: 'stream:exnessReceive',
  DB_STORAGE: 'stream:dbStorage',
} as const;

// ============================================
// Redis Keys
// ============================================
export const REDIS_KEYS = {
  PUBSUB_BINANCE: 'binance:pubsub',
} as const;

// ============================================
// Engine Constants
// ============================================
export const ENGINE_CONFIG = {
  CONCURRENCY_LIMIT: 10,
  MAX_WORKERS: 5,
  CONSUMER_GROUP: 'engine-group',
  CONSUMER_NAME_PREFIX: 'engine',
  POLLING_TIMEOUT_MS: 10,
  ERROR_RETRY_DELAY_MS: 1000,
} as const;

// ============================================
// Validation Constants
// ============================================
export const VALIDATION = {
  PIN_MIN_LENGTH: 4,
  PIN_MAX_LENGTH: 6,
  UUID_VERSION: 4,
  MIN_ORDER_AMOUNT: 0,
} as const;

// ============================================
// Candle Intervals
// ============================================
export const CANDLE_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const;

export type CandleInterval = (typeof CANDLE_INTERVALS)[number];

// ============================================
// Order Types
// ============================================
export const ORDER_SIDES = ['buy', 'sell'] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

// ============================================
// Default Values
// ============================================
export const DEFAULTS = {
  INITIAL_USER_BALANCE: 500000,
  PAGINATION_PAGE: 1,
  PAGINATION_LIMIT: 10,
  MAX_PAGINATION_LIMIT: 100,
  REQUEST_TIMEOUT_MS: 5000,
  CACHE_TTL_SECONDS: 300,
} as const;

// ============================================
// Response Messages
// ============================================
export const MESSAGES = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  BAD_REQUEST: 'Bad Request',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  SERVER_RUNNING: 'Server Running',
  ACCESS_DENIED_NO_TOKEN: 'Access denied. No token provided.',
  INVALID_TOKEN_TYPE: 'Invalid token type.',
  INVALID_TOKEN_NO_USER_ID: 'Invalid token: userId not found.',
  USER_NOT_FOUND: 'User not found in database. Please login again.',
  INVALID_TOKEN: 'Invalid token.',
} as const;

// ============================================
// Error Messages (Validation)
// ============================================
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Invalid email format',
  INVALID_ID_FORMAT: 'Invalid ID format',
  TOKEN_EMPTY: 'Token cannot be empty',
  PIN_LENGTH: 'PIN must be 4 to 6 digits',
  POSITIVE_NUMBER: 'Value must be greater than 0',
  POSITIVE_INTEGER: 'Value must be a positive integer',
  NON_NEGATIVE_NUMBER: 'Value must be zero or greater',
  INVALID_SYMBOL_FORMAT:
    'Symbol must be uppercase letters, numbers, or underscores (e.g. ETH_USDC_PERP, BTCUSDT)',
  ORDER_SIDE_INVALID: "Order type must be either 'buy' or 'sell'",
  INVALID_CANDLE_INTERVAL: 'Invalid candle interval',
} as const;

// ============================================
// Supported Assets
// ============================================
export const SUPPORTED_ASSETS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    imageUrl:
      'https://img.freepik.com/free-vector/cryptocurrency-bitcoin-golden-coin-background_1017-31505.jpg',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJDn0ojTITvcdAzMsfBMJaZC4STaDHzduleQ&s',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    imageUrl: 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png',
  },
] as const;

// ============================================
// Legacy Export (for backwards compatibility)
// ============================================
export const constant = {
  pubsubKey: REDIS_KEYS.PUBSUB_BINANCE,
  redisStream: REDIS_STREAMS.EXNESS,
  secondaryRedisStream: REDIS_STREAMS.EXNESS_RECEIVE,
  dbStorageStream: REDIS_STREAMS.DB_STORAGE,
} as const;

// ============================================
// Security Constants
// ============================================
export const SECURITY = {
  JWT_ALGORITHM: 'HS256',
  BCRYPT_SALT_ROUNDS: 10,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const;

// ============================================
// Rate Limiting
// ============================================
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 60000, // 1 minute
  DEFAULT_MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 900000, // 15 minutes
  AUTH_MAX_ATTEMPTS: 5,
} as const;
