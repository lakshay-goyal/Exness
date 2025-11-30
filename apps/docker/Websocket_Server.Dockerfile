FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/Websocket_Server ./apps/Websocket_Server

RUN bun install

WORKDIR /app/apps/Websocket_Server

EXPOSE 7070

CMD ["bun", "run", "src/index.ts"]

