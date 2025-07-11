# CODEX Node

A decentralized storage node for the CODEX network that pins and serves research objects.

## Environment Variables

### Required

- `CODEX_ENVIRONMENT`: Must be set to either `testnet`, `mainnet`, or `local`
  ```bash
  export CODEX_ENVIRONMENT=testnet  # or mainnet, or local
  ```

  **Note**: When set to `local`, metrics pushing is automatically disabled since local nodes run in isolated environments.

### Optional

- `IPFS_DATA_DIR`: Directory to store IPFS data (default: `./local-data/codex-node`)
- `CERAMIC_ONE_RPC_URL`: Ceramic RPC endpoint (default: `http://localhost:5101`)
- `CERAMIC_ONE_FLIGHT_URL`: Ceramic Flight SQL endpoint (default: `http://localhost:5102`)
- `METRICS_BACKEND_URL`: Metrics server URL (default: `http://localhost:3001`)
- `METRICS_PUSH_INTERVAL_MS`: Metrics push interval in milliseconds (default: `60000`)
- `PORT`: HTTP server port (default: `3000`)

## Quick Start

1. Set the environment:
   ```bash
   export CODEX_ENVIRONMENT=testnet
   ```

2. Start the node:
   ```bash
   npm start
   ```

## Environment Types

- **`testnet`**: Connects to the testnet network and pushes metrics to the metrics server
- **`mainnet`**: Connects to the mainnet network and pushes metrics to the metrics server
- **`local`**: Runs in isolated local mode, metrics pushing is disabled

## API Endpoints

- `GET /health` - Health check
- `GET /metrics` - Node metrics
- `GET /pins` - List pinned CIDs
- `POST /pin/:cid` - Pin a CID
- `DELETE /pin/:cid` - Unpin a CID
- `GET /test/:cid` - Fetch and serve a CID
- `POST /reprovide` - Reprovide all pinned CIDs
- `GET /libp2pinfo` - Libp2p node information
- `GET /queue` - Queue statistics
