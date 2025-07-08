# CODEX Node
The CODEX Node is a P2P application that subscribes to and replicates data published on CODEX.
The goal of the service is to increase network resiliency, improve data availability, and
decentralise the storage of CODEX information.

It has a built-in IPFS client built with [Helia](https://github.com/ipfs/helia), which is used to
persist and announce publication manifests.

The node consists of two services: a ceramic node, and the codex node. The ceramic node is
responsible for continually listening to network gossip about new events on CODEX streams.
The CODEX node subscribes to new states of these streams, and picks out the metadata manifests
to pin and reprovide them to the wider network.

## Prerequisites
- Docker

## Configuration
Both the `codex-node` and `ceramic-one` services are configured by envvars, which are pre-set per environment in the compose files.

## Running
When the services are first started, `ceramic-one` will connect to network bootstrap nodes and start syncing all known Codex streams.
This can take a little while, after which `codex-node` will start fetching metadata manifests for each of the streams.

### Starting the services
To start both the `ceramic-one` and `codex-node` containers running locally (isolated from the rest of the network, useful for testing):
```bash
docker compose -f ../../docker/compose.yaml up
```

To start both the `ceramic-one` and `codex-node` containers for the public Clay testnet (dev dPID namespace):
```bash
docker compose -f ../../docker/compose.dev.yaml up
```

### Persistence
Both services will create their own subdirectory in the `local-data` directory. This contains both the blocks/events for `ceramic-one`, and the block- and datastore for the IPFS client in `codex-node`.
When running against other networks, both `ceramic-one` and `codex-node` will use separate subdirectories under `local-data`.


## Development
Follow these instructions to run ceramic and the codex node in local development mode.

Install dependencies:
```bash
pnpm i
```

Start the ceramic-one service (in local/disconnected mode):
```bash
docker compose -f ../../docker/compose.yaml up
```

Run the codex node in dev mode:
```bash
pnpm run dev
```

## Reset the services
To start from a clean slate, delete the corresponding subdirectory under `local-data`.


## TODO
- Figure out libp2p connectivity issues (https://check.ipfs.network/?cid=bafkreiamccqck7of3qpzkxvzb4zkzqy2xoqmxjhpg5pwuw7aa4obuhfv2y&multiaddr=%2Fp2p%2F12D3KooWHhKaH7EqndPVQ2Nut8bircy8xZQAX9fEgxokdLBAYNix&ipniIndexer=https%3A%2F%2Fcid.contact&timeoutSeconds=61)
- Ensure announce/provide is working properly
- Add remote statistics reporting
