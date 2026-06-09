FROM oven/bun:1.2.18

WORKDIR /app

COPY package.json bun.lock turbo.json ./

COPY packages ./packages
COPY apps/web ./apps/web

RUN bun install

WORKDIR /app/packages/db
RUN bun run db:generate

WORKDIR /app/apps/web

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# must be provided as build args (runtime env in docker-compose has no effect on
# an already-built Next.js app). These are the URLs the browser will call.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
ARG NEXT_PUBLIC_DOCS_URL=http://localhost:3000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL

RUN bun run build

EXPOSE 3001
ENV PORT=3001

CMD ["bun", "run", "next", "start", "-p", "3001"]

