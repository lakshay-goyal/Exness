FROM oven/bun:1.2.18

WORKDIR /app

# Copy package files first
COPY package.json bun.lock turbo.json ./

# Create empty tests directory
RUN mkdir -p tests && echo '{"name":"tests","version":"1.0.0"}' > tests/package.json

# Copy packages and apps
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies
RUN bun install

# Generate Prisma client
WORKDIR /app/packages/db
RUN bun run db:generate

# Build Next.js app
WORKDIR /app/apps/web
RUN bun run build

EXPOSE 3001
ENV PORT=3001

CMD ["bun", "run", "next", "start", "-p", "3001"]

