FROM oven/bun:1.2.18

WORKDIR /app

# Copy package files first
COPY package.json bun.lock turbo.json ./

# Create empty tests directory
RUN mkdir -p tests && echo '{"name":"tests","version":"1.0.0"}' > tests/package.json

# Copy packages and apps
COPY packages ./packages
COPY apps/docs ./apps/docs

# Install dependencies
RUN bun install

WORKDIR /app/apps/docs

EXPOSE 3000
ENV PORT=3000

# Run in dev mode (build can be done separately if needed)
CMD ["bun", "run", "dev"]

