FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/docs ./apps/docs

RUN bun install

WORKDIR /app/apps/docs

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "dev"]

