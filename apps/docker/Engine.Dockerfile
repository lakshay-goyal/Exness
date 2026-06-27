# Engine - market-data / matching worker.
# Multi-stage: install + prisma generate -> bundle -> minimal runtime.

# ==========================================
# Base - install deps and generate Prisma client
# ==========================================
FROM oven/bun:1.2.18 AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/Engine ./apps/Engine

RUN bun install

WORKDIR /app/packages/db
RUN bun run db:generate
WORKDIR /app

# ==========================================
# Builder - bundle the app and all deps into one file
# ==========================================
FROM base AS builder

RUN bun build apps/Engine/src/index.ts \
    --outdir apps/Engine/dist --target bun --sourcemap

# ==========================================
# Development - full deps + source (used by docker-compose.dev.yml, which
# bind-mounts source and overrides the command with `bun run dev`)
# ==========================================
FROM base AS development
WORKDIR /app/apps/Engine
CMD ["bun", "run", "dev"]

# ==========================================
# Production - runtime image (bundle + Prisma engine only)
# Must remain the LAST stage: deploy.yml and docker-compose.yml build without
# an explicit --target, so the final stage is what ships.
# ==========================================
FROM oven/bun:1.2.18 AS production
WORKDIR /app

COPY --from=builder /app/apps/Engine/dist ./apps/Engine/dist
COPY --from=base /app/packages/db/generated/prisma ./packages/db/generated/prisma

CMD ["sh", "-c", "export PRISMA_QUERY_ENGINE_LIBRARY=$(ls /app/packages/db/generated/prisma/libquery_engine-*.so.node | head -1); exec bun apps/Engine/dist/index.js"]
