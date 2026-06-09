# Exness Trading Platform

A comprehensive cryptocurrency trading platform built with a microservices architecture, featuring real-time market data, order management, and user authentication.

## 🏗️ System Architecture

![Exness Architecture](packages/assets/ExnessArchitecture.png)

The platform follows a distributed microservices architecture with the following key components:

### Core Services

- **Frontend (Web)**: Next.js-based trading interface with real-time market data
- **Backend API**: Express.js REST API handling authentication, trading, and user management
- **Engine**: In-memory processing unit for high-performance order execution and SL/TP monitoring
- **Database Storage**: Handles user data and transaction persistence

## 📦 Applications

### Frontend Applications

- **`web`**: Main trading platform frontend built with Next.js and Tailwind CSS
  - Real-time trading dashboard
  - User authentication and profile management
  - Market data visualization with TradingView charts
  - Order management interface

- **`docs`**: Documentation site for the platform
  - API documentation
  - User guides and tutorials
  - System architecture documentation

### Backend Services

- **`Backend`**: Core API server
  - RESTful API endpoints for trading operations
  - User authentication and authorization
  - Balance and asset management
  - Candle data for charting
  - Trade execution endpoints

- **`Engine`**: High-performance trading engine
  - In-memory order processing
  - Real-time trade execution
  - Binance bookTicker subscription for stop-loss and take-profit monitoring
  - User data management
  - Order lifecycle management

- **`DBstorage`**: Database operations service
  - User data persistence
  - Transaction logging
  - Order history management

## 📚 Shared Packages

### Core Packages

- **`@repo/config`**: Centralized configuration management
  - Environment variables
  - Redis connections (streams, client)
  - Database configurations
  - Stream constants and keys

- **`@repo/types`**: Shared TypeScript types and public API shapes
  - Trading DTOs and API response types
  - Redis stream command and response shapes
  - Supported symbols, order sides, close reasons, and candle intervals

- **`@repo/trading-core`**: Shared trading domain logic
  - In-memory trading state store
  - Symbol mapping and price normalization
  - Order margin, P/L, and TP/SL calculations
  - Trade input validation helpers

- **`@repo/api-client`**: Shared backend API client
  - Platform-neutral trading requests for web and mobile
  - Shared response parsing for stringified and array payloads
  - Authenticated trade/profile calls and public market-data calls

- **`@repo/db`**: Database abstraction layer
  - Prisma ORM integration
  - Database client management
  - Type-safe database operations


### Utility Packages

- **`@repo/utils`**: Common utilities
  - Email notification system (Nodemailer)
  - Helper functions
  - Shared business logic

- **`@repo/ui`**: Reusable UI components
  - React components with Tailwind CSS
  - Trading interface components
  - Form elements and layouts

### Configuration Packages

- **`@repo/eslint-config`**: ESLint configurations
- **`@repo/typescript-config`**: TypeScript configurations
- **`@repo/tailwind-config`**: Tailwind CSS configuration
- **`@repo/typescript-config`**: Shared TypeScript settings

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Redis server
- PostgreSQL
- Binance API access (for market data)

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
bun run dev
```

### Development

```bash
# Start specific service
bun run dev --filter=backend
bun run dev --filter=web
bun run dev --filter=engine

# Build all packages
bun run build

# Run tests
bun run test
```

## 🔄 Data Flow

1. **Live Market Data**: Web and mobile clients stream bid/ask directly from Binance bookTicker WebSockets
2. **Order Processing**: Backend receives trade requests (with client bid/ask) and forwards to Engine via Redis streams
3. **Execution**: Engine processes orders in-memory for high performance
4. **Risk Monitoring**: Engine subscribes to Binance bookTicker streams for stop-loss and take-profit triggers
5. **Persistence**: Database services handle data storage and retrieval
6. **Historical Data**: Candle data fetched directly from Binance Kline API on-demand

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, TradingView Charts
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Caching**: Redis Streams
- **Real-time**: Binance WebSocket bookTicker streams
- **Market Data**: Binance WebSocket API
- **Build Tool**: Turborepo, Bun
- **Deployment**: Docker-ready architecture

## 📊 Key Features

- **Real-time Trading**: Live market data and instant order execution
- **High Performance**: In-memory processing for sub-millisecond latency
- **Scalable Architecture**: Microservices with Redis for horizontal scaling
- **Time-series Data**: Historical candle data from Binance Kline API
- **User Management**: Complete authentication and authorization system
- **Market Analysis**: Advanced charting with multiple timeframes
- **Risk Management**: Built-in order validation and balance checks

## 🔧 Configuration

The platform uses environment variables for configuration. Key settings include:

- Database connections (PostgreSQL, Redis)
- Binance API endpoints
- WebSocket ports and URLs
- Stream and queue names
- Security settings and CORS policies

## 📈 Performance Optimizations

- **In-memory Processing**: Engine service for ultra-fast order execution
- **Redis Streams**: Reliable message processing with backpressure handling
- **Binance Kline API**: Direct access to historical candle data
- **On-demand Fetching**: Real-time candle data without local storage overhead
- **Connection Pooling**: Efficient database connection management
