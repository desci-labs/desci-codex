# CODEX Metrics Server

A Node.js backend service to collect and visualize metrics from community CODEX nodes using PostgreSQL and Grafana.

## Features

- **Centralized Metrics Collection**: Collects metrics from multiple CODEX nodes
- **PostgreSQL Database**: Reliable and scalable database for metrics storage
- **Grafana Dashboards**: Real-time visualization of network metrics
- **Metrics push endpoint**: Simple HTTP endpoints for metrics submission


## Quick Start

### Prerequisites

- Docker (for building images)
- Node.js >= 22 (for development)

### Docker Compose

This will start:
- PostgreSQL 15
- Metrics Server
- Grafana

```bash
docker-compose ../../compose.metrics.yml up
```

### 4. Configure CODEX Nodes

Add these environment variables to your CODEX nodes:

```bash
METRICS_BACKEND_URL=http://your-cluster-url
METRICS_PUSH_INTERVAL_MS=300000  # 5 minutes, optional
```

## API Endpoints

### POST /api/v1/metrics/node

Submit node health metrics:

```bash
curl -X POST http://your-cluster-url/api/v1/metrics/node \
  -H "Content-Type: application/json" \
  -d '{
    "ipfsPeerId": "...",
    "ceramicPeerId": "...",
    "totalStreams": 150,
    "totalPinnedCids": 1200,
    "collectedAt": "2024-01-01T12:00:00Z"
  }'
```

## Database Schema

Migrations are run automatically when the service starts.

The node_metrics table stores node health and capacity metrics:
- `time`: Timestamp of the metric
- `ipfs_peer_id`: IPFS peer ID
- `ceramic_peer_id`: Ceramic peer ID
- `total_streams`: Number of streams on the node
- `total_pinned_cids`: Number of pinned CIDs on the node


## Grafana Integration

The Grafana configuration includes a PostgreSQL datasource:

```yaml
# grafana/provisioning/datasources/postgresql.yml
datasources:
  - name: PostgreSQL
    type: postgres
    url: postgres:5432
    database: codex_metrics
    user: postgres
    jsonData:
      sslmode: disable
      postgresVersion: 1500
```

The dashboard is bundled into the grafana image at build time.

### Dashboard Features

The provided dashboard includes:
- Active node count
- Total pinned CIDs and streams
- Average metrics per node
- Time-series charts for node activity


## Troubleshooting

### Logs

```bash
# Application logs
kubectl logs -f deployment/metrics-server -n codex

# Database logs (if using Docker)
docker logs codex-postgres

# Grafana logs
docker logs grafana
```

## License

MIT
