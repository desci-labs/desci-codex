# CODEX Metrics Server

A Node.js backend service to collect metrics from community CODEX nodes using PostgreSQL.

## Features

- **Centralized Metrics Collection**: Collects metrics from multiple CODEX nodes
- **PostgreSQL Database**: Reliable and scalable database for metrics storage
- **Metrics push endpoint**: Simple HTTP endpoints for metrics submission


## Quick Start

### Prerequisites

- Docker (for building images)
- Node.js >= 22 (for development)

### Docker Compose

This will start:
- PostgreSQL 15
- Metrics Server

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


## Visualisation

See the [network_status package](/packages/network_status/README.md).

## Troubleshooting

### Logs

```bash
# Application logs
kubectl logs -f deployment/metrics-server -n codex

# Database logs (if using Docker)
docker logs codex-postgres
```

## License

MIT
