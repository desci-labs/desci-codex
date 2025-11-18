# CODEX Docker Development Environment

This directory contains Docker Compose configurations for different development scenarios.

## Quick Start

Use the convenience script for easy management. Note it detaches, so you need to tail logs independently.

```bash
# Start development services only (ceramic + codex-node)
./run-dev.sh dev

# Start development services, including a local metrics server and database
./run-dev.sh dev-metrics

# Start metrics stack only
./run-dev.sh metrics

# Stop all containers
./run-dev.sh stop

# View logs
./run-dev.sh logs
```

## Configuration Files

### `compose.yaml` - Local Development
- **Purpose**: Local development with in-memory Ceramic network
- **Services**: ceramic (inmemory) + codex-node
- **Ports**:
  - Ceramic: 5101 (RPC), 5102 (Flight SQL)
  - Codex Node: 3000 (HTTP API)

### `compose.dev.yaml` - Testnet environment
- **Purpose**: Development against testnet Ceramic network
- **Services**: ceramic (testnet-clay) + codex-node
- **Use case**: Development and testing against real network
- **Ports**: Same as local

### `compose.dev-with-metrics.yaml` - Testnet development with local metrics metrics
- **Purpose**: Development environment with full metrics stack
- **Services**: ceramic (testnet) + codex-node + postgres + metrics-server
- **Use case**: Development with metrics collection and visualization
- **Ports**:
  - All dev ports + Metrics Server: 3001

### `compose.metrics.yml` - Metrics Stack Only
- **Purpose**: Standalone metrics collection and visualization
- **Services**: postgres + metrics-server
- **Use case**: Running metrics infrastructure independently
- **Ports**:
  - Metrics Server: 3001

## Environment Variables

### Metrics Configuration
The codex-node service can be configured to use metrics via environment variables.
By default, `compose.dev.yaml` connects to the remote metrics service automatically.

```bash
# Enable metrics (when running with metrics stack)
export METRICS_BACKEND_URL=http://metrics-server:3001

# Disable metrics (default behavior)
export METRICS_BACKEND_URL=
```

## Usage Examples

### Development Without Metrics
```bash
# Start just the development services
docker compose -f compose.dev.yaml up

# Or use the convenience script
./run-dev.sh dev
```

### Development With Metrics
```bash
# Start development services with metrics
docker compose -f compose.dev-with-metrics.yaml up

# Or use the convenience script
./run-dev.sh dev-metrics
```

### Just Metrics Infrastructure
```bash
# Start only the metrics stack
docker compose -f compose.metrics.yml up

# Or use the convenience script
./run-dev.sh metrics
```

## Service Dependencies

### Development Services (`compose.dev.yaml`)
```
codex-node ──> ceramic
```

### Development with Metrics (`compose.dev-with-metrics.yaml`)
```
codex-node ──> ceramic
codex-node ──> metrics-server ──> postgres
```

### Metrics Only (`compose.metrics.yml`)
```
metrics-server ──> postgres
```

## Health Checks

All services include health checks to ensure proper startup order:

- **Ceramic**: SQL query test to verify database connectivity
- **Codex Node**: HTTP health check at `/health`
- **PostgreSQL**: `pg_isready` command
- **Metrics Server**: HTTP health check at `/health`

## Data Persistence

- **Ceramic data**: Stored in `../local-data/testnet/ceramic-one` (dev) or `../local-data/local/ceramic-one` (local)
- **Codex Node data**: Stored in `../local-data/testnet/codex-node` (dev) or `../local-data/local/codex-node` (local)
- **PostgreSQL**: Docker volume `postgres-data` (metrics only)

## Troubleshooting

### View Logs
```bash
# View logs for running containers
./run-dev.sh logs

# Or view specific service logs
docker compose -f compose.dev.yaml logs -f codex-node
```

### Metrics Not Working
1. Ensure the metrics stack is running: `./run-dev.sh metrics`
2. Check that `METRICS_BACKEND_URL` is set correctly
3. Verify metrics-server is healthy: `curl http://localhost:3001/health`
