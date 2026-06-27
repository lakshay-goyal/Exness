# Build stage. Dependencies + Prisma client are produced with Bun, but the
# Next.js build itself runs under Node: `next build` collects page data by
# executing the app in the JS runtime, and the Bun runtime trips a
# "Expected CommonJS module to have a function wrapper" bug there. The
# oven/bun image ships no Node, so we add it for the build only.
FROM oven/bun:1.2.18 AS build

# Node 20 for `next build` (NodeSource keeps it current; Debian's is too old).
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/web ./apps/web

RUN bun install

WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/apps/web

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# must be provided as build args (runtime env in docker-compose has no effect on
# an already-built Next.js app). These are the URLs the browser will call.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# npx resolves next from the hoisted workspace node_modules and runs it with
# Node (not Bun). --no-install keeps it offline (next is already installed).
# Emits a standalone server (see next.config.ts: output: 'standalone').
RUN npx --no-install next build

# Runtime stage. The standalone build is a self-contained server.js plus only
# the node_modules Next traced — ~200 MB instead of copying the whole monorepo.
# Still served with Node (the Bun CommonJS-wrapper bug also breaks SSR at
# runtime). Debian/bookworm in both stages keeps the Prisma engine ABI matched.
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# outputFileTracingRoot=<repo root> makes the standalone tree mirror the
# monorepo layout: apps/web/server.js with node_modules hoisted at the root.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3001
ENV PORT=3001 \
    HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
