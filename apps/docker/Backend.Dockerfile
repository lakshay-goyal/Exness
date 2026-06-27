# Backend - Express API (Port 8000)
# Multi-stage: install + prisma generate -> bundle -> minimal runtime.

# ==========================================
# Base - install deps and generate Prisma client
# ==========================================
FROM oven/bun:1.2.18 AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/Backend ./apps/Backend

RUN bun install

# Generate the Prisma client (custom output: packages/db/generated/prisma).
WORKDIR /app/packages/db
RUN bun run db:generate
WORKDIR /app

# ==========================================
# Builder - bundle the app and all deps into one file
# ==========================================
FROM base AS builder

# Bundle entry + deps so the runtime image needs no node_modules. The Prisma
# client's native query engine is loaded at runtime from the generated dir
# (shipped below), not from the bundle.
RUN bun build apps/Backend/src/index.ts \
    --outdir apps/Backend/dist --target bun --sourcemap

# ==========================================
# Development - full deps + source (used by docker-compose.dev.yml, which
# bind-mounts source and overrides the command with `bun run dev`)
# ==========================================
FROM base AS development
WORKDIR /app/apps/Backend
CMD ["bun", "run", "dev"]

# ==========================================
# Production - runtime image (bundle + Prisma engine only)
# Must remain the LAST stage: deploy.yml and docker-compose.yml build without
# an explicit --target, so the final stage is what ships.
# ==========================================
FROM oven/bun:1.2.18 AS production
WORKDIR /app

COPY --from=builder /app/apps/Backend/dist ./apps/Backend/dist
COPY --from=base /app/packages/db/generated/prisma ./packages/db/generated/prisma

EXPOSE 8000

# Point Prisma at the generated query-engine library (name varies by platform).
CMD ["sh", "-c", "export PRISMA_QUERY_ENGINE_LIBRARY=$(ls /app/packages/db/generated/prisma/libquery_engine-*.so.node | head -1); exec bun apps/Backend/dist/index.js"]
