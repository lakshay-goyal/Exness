FROM oven/bun:1.2.18

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock turbo.json ./

# Create empty tests directory
RUN mkdir -p tests && echo '{"name":"tests","version":"1.0.0"}' > tests/package.json

# Copy packages and apps
COPY packages ./packages
COPY apps/Backend ./apps/Backend

# Install dependencies
RUN bun install

# Generate Prisma client
WORKDIR /app/packages/db
RUN bun run db:generate

# Set working directory
WORKDIR /app/apps/Backend

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]

