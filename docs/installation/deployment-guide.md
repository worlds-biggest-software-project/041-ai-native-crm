# NativeCRM Production Deployment Guide

This guide covers deploying NativeCRM to production across multiple
infrastructure options: Docker, manual/VPS, and cloud platforms.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Docker Deployment](#docker-deployment)
- [Manual / VPS Deployment](#manual--vps-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Operational Concerns](#operational-concerns)

---

## Architecture Overview

A production NativeCRM deployment consists of four components:

```
                  +-----------+
  Browser ------> |  Next.js  | ------> PostgreSQL 16
                  |   App     |
                  +-----------+
                       |
                       v
                  +-----------+
                  |  BullMQ   | ------> Redis 7
                  |  Workers  |
                  +-----------+
```

| Component | Description |
|-----------|-------------|
| **Next.js App** | Serves the web UI, tRPC endpoints, REST API (`/api/v1/*`), MCP server (`/api/mcp`), and webhook receivers. Runs as a standalone Node.js server. |
| **BullMQ Workers** | Processes background queues: `email-sync`, `calendar-sync`, `ai-jobs`, `scoring`, `enrichment`, `webhook-dispatch`, `webhook`, `ai-summary`. Runs as a separate Node.js process from the same codebase. |
| **PostgreSQL 16** | Primary data store. Stores all CRM records, audit logs, custom field definitions, and workflow configurations. |
| **Redis 7** | BullMQ job queue broker, rate limiting counters, and ephemeral cache. |

The Next.js app produces a `standalone` output (configured in `next.config.ts`)
which bundles all dependencies into a minimal deployment artifact.

---

## Docker Deployment

### Building the Production Image

The multi-stage `Dockerfile` produces a minimal production image:

```bash
cd target
docker build -t nativecrm:latest --target production .
```

The production stage:
- Uses `node:22-alpine` as the base (minimal image size).
- Copies only the standalone build output, static assets, and public files.
- Runs as a non-root `nextjs` user (UID 1001).
- Exposes port 3000.

### Production docker-compose.yml

Create a `docker-compose.prod.yml` for the full production stack:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-crm}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-ai_native_crm}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-crm} -d ${POSTGRES_DB:-ai_native_crm}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - internal

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 5s
    networks:
      - internal

  app:
    image: nativecrm:latest
    restart: unless-stopped
    ports:
      - "${APP_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER:-crm}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-ai_native_crm}"
      REDIS_URL: "redis://:${REDIS_PASSWORD}@redis:6379"
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      AZURE_AD_CLIENT_ID: ${AZURE_AD_CLIENT_ID}
      AZURE_AD_CLIENT_SECRET: ${AZURE_AD_CLIENT_SECRET}
      AZURE_AD_TENANT_ID: ${AZURE_AD_TENANT_ID}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      API_SECRET: ${API_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      CORS_ORIGIN: ${CORS_ORIGIN}
      NODE_ENV: production
    networks:
      - internal

  worker:
    image: nativecrm:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://${POSTGRES_USER:-crm}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-ai_native_crm}"
      REDIS_URL: "redis://:${REDIS_PASSWORD}@redis:6379"
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      NODE_ENV: production
    command: ["node", "server/workers/index.js"]
    networks:
      - internal

volumes:
  postgres_data:
  redis_data:

networks:
  internal:
    driver: bridge
```

### Environment Variables File

Create a `.env.production` file alongside the compose file:

```dotenv
POSTGRES_USER=crm
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=ai_native_crm
REDIS_PASSWORD=<strong-random-password>
APP_PORT=3000

NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://crm.yourdomain.com

GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
AZURE_AD_CLIENT_ID=<your-azure-client-id>
AZURE_AD_CLIENT_SECRET=<your-azure-client-secret>
AZURE_AD_TENANT_ID=<your-azure-tenant-id>

ANTHROPIC_API_KEY=<your-anthropic-api-key>
API_SECRET=<openssl rand -base64 32>
ENCRYPTION_KEY=<openssl rand -hex 32>
CORS_ORIGIN=https://crm.yourdomain.com
```

### Deploying

```bash
# Build the image
docker build -t nativecrm:latest --target production target/

# Start the stack
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec app \
  node -e "require('./server/db/migrate.js')"

# Verify health
docker compose -f docker-compose.prod.yml ps
curl -s https://crm.yourdomain.com/api/v1/openapi.json | head -5
```

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /` | Returns 200 if the Next.js server is running |
| `GET /api/v1/openapi.json` | Returns 200 with the OpenAPI spec if the API layer is healthy |

For container orchestration, use `GET /` as the health check target on port
3000.

### Scaling Workers Independently

Workers can be scaled horizontally. Each worker instance picks jobs from Redis
queues independently:

```bash
docker compose -f docker-compose.prod.yml up -d --scale worker=3
```

For fine-grained control, you can run dedicated workers per queue:

```yaml
  worker-email:
    image: nativecrm:latest
    command: ["node", "server/workers/index.js", "--queues=email-sync,calendar-sync"]
    # ... same environment as worker

  worker-ai:
    image: nativecrm:latest
    command: ["node", "server/workers/index.js", "--queues=ai-jobs,ai-summary,scoring"]
    # ... same environment as worker

  worker-integration:
    image: nativecrm:latest
    command: ["node", "server/workers/index.js", "--queues=enrichment,webhook-dispatch,webhook"]
    # ... same environment as worker
```

### Volume Mounts for Persistent Data

| Volume | Container Path | Purpose |
|--------|---------------|---------|
| `postgres_data` | `/var/lib/postgresql/data` | PostgreSQL data directory. Back this up. |
| `redis_data` | `/data` | Redis AOF and RDB files. Recoverable from PostgreSQL if lost. |

---

## Manual / VPS Deployment

### 1. Build the Standalone Application

On your build machine (or CI server):

```bash
cd target
pnpm install --frozen-lockfile
pnpm build
```

This produces `.next/standalone/` containing a self-contained Node.js server.
Copy the build artifacts to your server:

```bash
rsync -avz .next/standalone/ user@server:/opt/nativecrm/
rsync -avz .next/static/ user@server:/opt/nativecrm/.next/static/
rsync -avz public/ user@server:/opt/nativecrm/public/
```

### 2. PostgreSQL Setup and Tuning

Install PostgreSQL 16 and create the database:

```bash
sudo apt install postgresql-16
sudo -u postgres psql <<SQL
  CREATE USER crm WITH PASSWORD '<strong-password>';
  CREATE DATABASE ai_native_crm OWNER crm;
  -- Enable recommended extensions
  \c ai_native_crm
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
SQL
```

**Tuning for production** (adjust for your available RAM):

Edit `/etc/postgresql/16/main/postgresql.conf`:

```ini
# Memory (for a 4GB server)
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB

# Connections
max_connections = 200

# WAL
wal_level = replica
max_wal_senders = 3

# Logging
log_min_duration_statement = 1000
log_statement = 'ddl'
```

### 3. Redis Setup

Install Redis 7 and enable persistence:

```bash
sudo apt install redis-server
```

Edit `/etc/redis/redis.conf`:

```ini
# Require a password
requirepass <strong-password>

# Enable AOF persistence
appendonly yes
appendfsync everysec

# Memory limit (adjust for your server)
maxmemory 512mb
maxmemory-policy allkeys-lru
```

Restart Redis:

```bash
sudo systemctl restart redis-server
```

### 4. Process Management

#### Using PM2

Install PM2 globally:

```bash
npm install -g pm2
```

Create `ecosystem.config.cjs` on the server:

```js
module.exports = {
  apps: [
    {
      name: "nativecrm-app",
      cwd: "/opt/nativecrm",
      script: "server.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://crm:<password>@localhost:5432/ai_native_crm",
        REDIS_URL: "redis://:<password>@localhost:6379",
        NEXTAUTH_SECRET: "<secret>",
        NEXTAUTH_URL: "https://crm.yourdomain.com",
        // ... all other environment variables
      },
    },
    {
      name: "nativecrm-worker",
      cwd: "/opt/nativecrm",
      script: "server/workers/index.js",
      instances: 2,
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://crm:<password>@localhost:5432/ai_native_crm",
        REDIS_URL: "redis://:<password>@localhost:6379",
        ANTHROPIC_API_KEY: "<key>",
        ENCRYPTION_KEY: "<key>",
      },
    },
  ],
};
```

Start and configure auto-restart:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

#### Using systemd

Create `/etc/systemd/system/nativecrm.service`:

```ini
[Unit]
Description=NativeCRM Web Server
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=nativecrm
WorkingDirectory=/opt/nativecrm
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/nativecrm/.env.production

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/nativecrm-worker.service`:

```ini
[Unit]
Description=NativeCRM Background Workers
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=nativecrm
WorkingDirectory=/opt/nativecrm
ExecStart=/usr/bin/node server/workers/index.js
Restart=always
RestartSec=5
EnvironmentFile=/opt/nativecrm/.env.production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable nativecrm nativecrm-worker
sudo systemctl start nativecrm nativecrm-worker
```

### 5. Reverse Proxy with SSL

#### Nginx

Install Nginx and Certbot:

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/nativecrm`:

```nginx
upstream nativecrm {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name crm.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/crm.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers (additional to those set by Next.js)
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;

    # SSE support for MCP endpoint
    location /api/mcp {
        proxy_pass http://nativecrm;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    location / {
        proxy_pass http://nativecrm;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets with long cache
    location /_next/static/ {
        proxy_pass http://nativecrm;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 50M;
}
```

Enable and obtain certificate:

```bash
sudo ln -s /etc/nginx/sites-available/nativecrm /etc/nginx/sites-enabled/
sudo certbot --nginx -d crm.yourdomain.com
sudo systemctl reload nginx
```

#### Caddy (simpler alternative)

Create a `Caddyfile`:

```
crm.yourdomain.com {
    reverse_proxy localhost:3000

    # SSE support for MCP
    @mcp path /api/mcp
    reverse_proxy @mcp localhost:3000 {
        flush_interval -1
    }
}
```

Caddy automatically obtains and renews Let's Encrypt certificates.

### 6. Running Workers as Separate Processes

Workers can run on the same server or on dedicated machines. They need:
- Access to PostgreSQL (via `DATABASE_URL`)
- Access to Redis (via `REDIS_URL`)
- `ANTHROPIC_API_KEY` (for AI queues)
- `ENCRYPTION_KEY` (for decrypting OAuth tokens during sync)

Workers do **not** need `NEXTAUTH_*`, `GOOGLE_CLIENT_*`, or `CORS_ORIGIN`
variables, as they do not serve HTTP traffic.

---

## Cloud Platform Deployment

### Vercel + Managed Services

NativeCRM's Next.js frontend deploys to Vercel. Background workers require a
separate compute service.

**Architecture:**
- **Vercel:** Next.js application (web UI, API routes, MCP endpoint)
- **Neon / Supabase / AWS RDS:** Managed PostgreSQL 16
- **Upstash / AWS ElastiCache:** Managed Redis 7
- **Railway / Render / AWS ECS:** BullMQ workers

**Vercel setup:**

1. Connect your Git repository to Vercel.
2. Set the root directory to `target/`.
3. Framework preset: Next.js.
4. Add all environment variables in the Vercel dashboard.
5. Deploy.

**Important Vercel limitations:**
- Vercel Functions have a maximum execution time (10s on Hobby, 60s on Pro).
  Long-running operations must use the BullMQ worker process.
- The MCP SSE endpoint requires Vercel Pro or Enterprise for long-lived
  connections.

### AWS (ECS/Fargate + RDS + ElastiCache)

**Infrastructure:**

| Service | AWS Resource | Configuration |
|---------|-------------|---------------|
| App | ECS Fargate | 1+ tasks, 0.5 vCPU, 1GB RAM per task |
| Workers | ECS Fargate | 1+ tasks, 1 vCPU, 2GB RAM per task |
| Database | RDS PostgreSQL 16 | db.t4g.medium, Multi-AZ for production |
| Cache | ElastiCache Redis 7 | cache.t4g.micro, single node for start |
| Load Balancer | ALB | HTTPS termination, target groups for app |

**ECS Task Definition (app):**

```json
{
  "family": "nativecrm-app",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "<account>.dkr.ecr.<region>.amazonaws.com/nativecrm:latest",
      "portMappings": [{ "containerPort": 3000 }],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:...:parameter/nativecrm/database-url" },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:ssm:...:parameter/nativecrm/redis-url" },
        { "name": "NEXTAUTH_SECRET", "valueFrom": "arn:aws:ssm:...:parameter/nativecrm/nextauth-secret" }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nativecrm-app",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "app"
        }
      }
    }
  ],
  "cpu": "512",
  "memory": "1024",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"]
}
```

**Worker task definition** is identical except:
- Container command overrides to `["node", "server/workers/index.js"]`
- No port mappings or health check HTTP endpoint needed
- No `NEXTAUTH_*` or `CORS_ORIGIN` secrets required

### Railway / Render One-Click Deploy

Both platforms support deploying Docker-based applications from a Git
repository.

**Railway:**

1. Create a new project from your Git repo.
2. Set the root directory to `target/`.
3. Add a PostgreSQL plugin and Redis plugin from the Railway dashboard.
4. Railway auto-detects the Dockerfile and builds the production image.
5. Add all environment variables. Use `${{Postgres.DATABASE_URL}}` and
   `${{Redis.REDIS_URL}}` template variables for database and cache URLs.
6. Add a second service for workers using the same repo and Docker image, with
   the start command overridden to `node server/workers/index.js`.

**Render:**

1. Create a new Web Service from your Git repo.
2. Docker runtime, root directory `target/`.
3. Add a Render PostgreSQL database and a Render Redis instance.
4. Set environment variables including the auto-generated `DATABASE_URL` and
   `REDIS_URL` from Render's managed services.
5. Create a separate Background Worker service for BullMQ processing.

---

## Operational Concerns

### Monitoring and Logging

**Application logs:** NativeCRM logs structured JSON to stdout. Collect with
your preferred log aggregation tool (e.g., Datadog, Loki, CloudWatch Logs,
Papertrail).

**Key metrics to monitor:**

| Metric | Source | Alert Threshold |
|--------|--------|----------------|
| HTTP response time p95 | Reverse proxy / APM | > 500ms |
| HTTP 5xx rate | Reverse proxy logs | > 1% of requests |
| BullMQ queue depth | Redis `LLEN` on queue keys | > 1000 jobs waiting |
| BullMQ failed jobs | Redis / BullMQ dashboard | > 10 per hour |
| PostgreSQL active connections | `pg_stat_activity` | > 80% of `max_connections` |
| PostgreSQL replication lag | `pg_stat_replication` | > 10 seconds |
| Redis memory usage | `INFO memory` | > 80% of `maxmemory` |
| Disk usage (Postgres data) | OS metrics | > 80% capacity |
| Email sync latency | Application metrics | > 10 minutes |
| AI summary generation time | Application metrics | > 60 seconds |

**BullMQ dashboard:** Consider deploying [Bull Board](https://github.com/felixmosh/bull-board)
or [Arena](https://github.com/bee-queue/arena) as a separate service for queue
monitoring and job inspection.

### Backup Strategy

**PostgreSQL:**

Use WAL archiving for continuous backup with point-in-time recovery:

```bash
# pg_basebackup for initial full backup
pg_basebackup -h localhost -U crm -D /backups/base --wal-method=stream

# Continuous WAL archiving (configure in postgresql.conf)
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
```

For managed PostgreSQL (RDS, Neon, Supabase), automated backups are included.
Verify the retention period meets your requirements (recommended: 30 days).

**Daily logical backup** (in addition to WAL archiving):

```bash
pg_dump -h localhost -U crm -Fc ai_native_crm > /backups/daily/nativecrm_$(date +%Y%m%d).dump
```

**Redis:**

Redis data is recoverable from PostgreSQL (it stores queues and ephemeral
cache). Configure Redis persistence as a convenience, not as the primary backup:

```ini
# RDB snapshots
save 900 1
save 300 10

# AOF for durability
appendonly yes
```

### Update / Upgrade Process

1. **Pull the latest code** and build the new image:
   ```bash
   git pull origin main
   cd target
   docker build -t nativecrm:latest --target production .
   ```

2. **Run database migrations** before updating the running application:
   ```bash
   docker compose -f docker-compose.prod.yml run --rm app \
     node -e "require('./server/db/migrate.js')"
   ```

3. **Rolling restart** (zero-downtime if running multiple app instances):
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps app worker
   ```

4. **Verify** the deployment:
   ```bash
   curl -s https://crm.yourdomain.com/api/v1/openapi.json | head -5
   docker compose -f docker-compose.prod.yml ps
   docker compose -f docker-compose.prod.yml logs --tail=50 app
   ```

### SSL Certificate Management

- **Let's Encrypt + Certbot:** Certificates auto-renew via cron. Verify with
  `sudo certbot renew --dry-run`.
- **Caddy:** Automatic. No configuration needed.
- **AWS ALB:** Use AWS Certificate Manager (ACM) for free, auto-renewing
  certificates.
- **Cloudflare:** Use Full (Strict) SSL mode with an origin certificate.

### Performance Tuning

**Connection pooling:**

For high-traffic deployments, place PgBouncer between the application and
PostgreSQL:

```ini
# pgbouncer.ini
[databases]
ai_native_crm = host=localhost port=5432 dbname=ai_native_crm

[pgbouncer]
pool_mode = transaction
max_client_conn = 400
default_pool_size = 25
```

Update `DATABASE_URL` to point to PgBouncer (typically port 6432).

**Worker concurrency:**

Each BullMQ worker instance processes jobs concurrently. Default concurrency
settings can be tuned per queue. See [configuration.md](configuration.md) for
details on the `WORKER_CONCURRENCY_*` variables.

**Next.js standalone server:**

The standalone output runs a single-threaded Node.js server. For multi-core
servers, run multiple app instances behind a load balancer, or use PM2 cluster
mode:

```js
// PM2 cluster mode
{
  name: "nativecrm-app",
  script: "server.js",
  instances: "max",  // one per CPU core
  exec_mode: "cluster",
}
```

**Static asset caching:**

Configure your reverse proxy or CDN to cache `/_next/static/*` with long TTLs
(365 days). These files are content-hashed and immutable.

**Database indexing:**

The Drizzle schema includes GIN indexes on JSONB columns and B-tree indexes on
frequently queried fields. Monitor slow queries with `pg_stat_statements` and
add indexes as needed:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```
