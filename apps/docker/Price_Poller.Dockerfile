FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/Price_Poller ./apps/Price_Poller

RUN bun install

WORKDIR /app/apps/Price_Poller

CMD ["bun", "run", "src/index.ts"]

