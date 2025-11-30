FROM oven/bun:1.2.18

WORKDIR /app

# Copy package files first
COPY package.json bun.lock turbo.json ./

# Copy packages and apps
COPY packages ./packages
COPY apps/DBstorage ./apps/DBstorage

# Install dependencies
RUN bun install

# Generate Prisma client
WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/apps/DBstorage

CMD ["bun", "run", "src/index.ts"]

