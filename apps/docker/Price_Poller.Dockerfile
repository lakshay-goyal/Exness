FROM oven/bun:1.2.18

WORKDIR /app

# Copy package files first
COPY package.json bun.lock turbo.json ./

# Create empty tests directory
RUN mkdir -p tests && echo '{"name":"tests","version":"1.0.0"}' > tests/package.json

# Copy packages and apps
COPY packages ./packages
COPY apps/Price_Poller ./apps/Price_Poller

# Install dependencies
RUN bun install

WORKDIR /app/apps/Price_Poller

CMD ["bun", "run", "src/index.ts"]

