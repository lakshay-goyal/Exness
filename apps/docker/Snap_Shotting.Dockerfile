FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/Engine ./apps/Engine

RUN bun install

WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/packages/snap-shotting

CMD ["bun", "run", "index.ts"]

