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
RUN npx --no-install next build

# Runtime stage. `next start` runs fine under Bun (only the build was affected),
# so the shipped image stays Node-free and small.
FROM oven/bun:1.2.18 AS runner

WORKDIR /app
COPY --from=build /app /app

WORKDIR /app/apps/web

EXPOSE 3001
ENV PORT=3001

CMD ["bun", "run", "next", "start", "-p", "3001"]
