FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/Backend ./apps/Backend

RUN bun install

WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/apps/Backend

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]

