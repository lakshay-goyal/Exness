# Migrate - one-shot Prisma migration runner.
#
# The service images bundle their app and ship no Prisma CLI, so the
# db-migrate step (which runs `prisma migrate deploy`) can no longer piggyback
# on the backend image. This dedicated image keeps the full toolchain
# (prisma CLI + engines + schema + migrations) and is used only by the
# db-migrate container, which runs once per deploy and exits.
FROM oven/bun:1.2.18 AS base
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages ./packages

# Full install (incl. the prisma devDependency) and generate the client so the
# query/schema engines are present for `prisma migrate deploy`.
RUN bun install
RUN cd packages/db && bun run db:generate

# db-migrate overrides this with its own command; the default keeps the image
# runnable on its own (cd into the db package and apply pending migrations).
CMD ["sh", "-c", "cd /app/packages/db && bun run db:deploy"]
