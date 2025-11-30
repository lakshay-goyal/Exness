# Docker Setup for Exness Services

This directory contains Dockerfiles for all services in the Exness project.

## Services

- **Backend.Dockerfile** - Main backend API service (Port 8000)
- **Engine.Dockerfile** - Trading engine service
- **Price_Poller.Dockerfile** - Market data polling service
- **Websocket_Server.Dockerfile** - WebSocket server (Port 7070)
- **Batch_Upload.Dockerfile** - Batch data upload service
- **DBstorage.Dockerfile** - Database storage service
- **web.Dockerfile** - Next.js web application (Port 3001)
- **docs.Dockerfile** - Next.js documentation site (Port 3000)

## Usage

All services are orchestrated via `docker-compose.yml` in the root directory.

### Starting all services:

```bash
docker-compose up -d
```

### Starting specific services:

```bash
docker-compose up -d postgres timescaledb redis backend
```

### Viewing logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stopping services:

```bash
docker-compose down
```

### Rebuilding services:

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Database Migrations

Before starting the services, you may need to run Prisma migrations:

```bash
# Run migrations on the backend service
docker-compose exec backend bun run --cwd /app/packages/db db:migrate deploy
```

Or run migrations locally before starting Docker services.

## Environment Variables

All environment variables are configured in `docker-compose.yml`. The services use:
- **PostgreSQL** for main database (port 5434)
- **TimescaleDB** for time-series data (port 5433)
- **Redis** for caching and messaging (port 6379)

Service-to-service communication uses Docker service names (e.g., `postgres`, `timescaledb`, `redis`) instead of `localhost`.

