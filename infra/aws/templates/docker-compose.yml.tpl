# Rendered by Terraform, stored in S3, executed on the EC2 instance.
# Dollar-brace placeholders resolve at runtime from /opt/exness/.env (written
# by deploy.sh from SSM Parameter Store); everything else is baked in by
# Terraform at render time.
#
# Every app service gets the full env set: the shared zod schema in
# packages/config/src/env/index.ts requires REDIS_URL, DATABASE_URL,
# MONGODB_URL, JWT_SECRET, PORT, FRONTEND_URL, NODE_ENV, USER_EMAIL,
# USER_PASSWORD, and BACKEND_URL in every consumer.

x-app-env: &app-env
  NODE_ENV: production
  PORT: '8000'
  REDIS_URL: redis://redis:6379
  DATABASE_URL: postgresql://postgresql:$${POSTGRES_PASSWORD}@postgres:5432/exness
  MONGODB_URL: mongodb://admin:$${MONGO_PASSWORD}@mongodb:27017/exness_snapshots?authSource=admin
  FRONTEND_URL: ${web_url}
  BACKEND_URL: ${backend_url}
  JWT_SECRET: $${JWT_SECRET}
  BETTER_AUTH_SECRET: $${BETTER_AUTH_SECRET}
  GOOGLE_CLIENT_ID: $${GOOGLE_CLIENT_ID}
  GOOGLE_CLIENT_SECRET: $${GOOGLE_CLIENT_SECRET}
  USER_EMAIL: $${USER_EMAIL}
  USER_PASSWORD: $${USER_PASSWORD}

services:
  postgres:
    image: postgres:16-alpine
    container_name: exness-postgres
    environment:
      POSTGRES_USER: postgresql
      POSTGRES_PASSWORD: $${POSTGRES_PASSWORD}
      POSTGRES_DB: exness
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgresql -d exness']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: exness-redis
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  mongodb:
    image: mongo:7.0
    container_name: exness-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: $${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: exness_snapshots
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: ['CMD', 'mongosh', '--eval', "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  db-migrate:
    image: ${registry}/${project}-backend:$${IMAGE_TAG}
    container_name: exness-db-migrate
    environment:
      <<: *app-env
    command: >
      sh -c "
        cd /app/packages/db &&
        echo 'Running Prisma migrations...' &&
        bun run db:deploy &&
        echo 'Migrations completed!'
      "
    depends_on:
      postgres:
        condition: service_healthy
    restart: 'no'

  backend:
    image: ${registry}/${project}-backend:$${IMAGE_TAG}
    container_name: exness-backend
    environment:
      <<: *app-env
      PORT: '8000'
    ports:
      - '8000:8000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      db-migrate:
        condition: service_completed_successfully
    restart: unless-stopped

  engine:
    image: ${registry}/${project}-engine:$${IMAGE_TAG}
    container_name: exness-engine
    environment:
      <<: *app-env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      db-migrate:
        condition: service_completed_successfully
    restart: unless-stopped

  snap-shotting:
    image: ${registry}/${project}-snap-shotting:$${IMAGE_TAG}
    container_name: exness-snap-shotting
    environment:
      <<: *app-env
    depends_on:
      mongodb:
        condition: service_healthy
      engine:
        condition: service_started
    restart: unless-stopped

  dbstorage:
    image: ${registry}/${project}-dbstorage:$${IMAGE_TAG}
    container_name: exness-dbstorage
    environment:
      <<: *app-env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      db-migrate:
        condition: service_completed_successfully
    restart: unless-stopped

  web:
    # NEXT_PUBLIC_* URLs are baked into this image at build time by CI.
    image: ${registry}/${project}-web:$${IMAGE_TAG}
    container_name: exness-web
    environment:
      <<: *app-env
      PORT: '3001'
    ports:
      - '3001:3001'
    depends_on:
      backend:
        condition: service_started
    restart: unless-stopped

  nginx:
    image: nginx:1.27-alpine
    container_name: exness-nginx
    # periodic reload picks up certificates renewed by the certbot service
    command: /bin/sh -c "while :; do sleep 6h; nginx -s reload; done & exec nginx -g 'daemon off;'"
    ports:
      - '80:80'
      - '443:443'
    volumes:
      # deploy.sh fetches this from S3 alongside the compose file
      - /opt/exness/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      # deploy.sh runs the first certbot issuance into these host dirs
      - /opt/exness/letsencrypt:/etc/letsencrypt:ro
      - /opt/exness/certbot-webroot:/var/www/certbot:ro
    depends_on:
      web:
        condition: service_started
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    container_name: exness-certbot
    # renew loop; nginx reloads on its own schedule to pick up new certs
    entrypoint: /bin/sh -c "trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h; done"
    volumes:
      - /opt/exness/letsencrypt:/etc/letsencrypt
      - /opt/exness/certbot-webroot:/var/www/certbot
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  mongodb_data:
