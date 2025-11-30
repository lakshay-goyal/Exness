FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/Batch_Upload ./apps/Batch_Upload

RUN bun install

WORKDIR /app/apps/Batch_Upload

CMD ["bun", "run", "src/index.ts"]

