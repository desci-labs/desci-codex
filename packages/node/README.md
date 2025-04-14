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

## Running
To start both the `ceramic-one` and `codex-node` containers:
```bash
docker compose up
```

By default, this runs against the Clay testnet. This corresponds to the "dev" dPID namespace.

### Persistence
Both services will create their own subdirectory in the `local-data` directory. This contains both the blocks/events for `ceramic-one`, and the block- and datastore for the IPFS client in `codex-node`.


## TODO
- Figure out libp2p connectivity issues (https://check.ipfs.network/?cid=bafkreiamccqck7of3qpzkxvzb4zkzqy2xoqmxjhpg5pwuw7aa4obuhfv2y&multiaddr=%2Fp2p%2F12D3KooWHhKaH7EqndPVQ2Nut8bircy8xZQAX9fEgxokdLBAYNix&ipniIndexer=https%3A%2F%2Fcid.contact&timeoutSeconds=61)
- Ensure announce/provide is working properly
- Add remote statistics reporting
