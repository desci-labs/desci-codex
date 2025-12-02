![DeSci Codex logotype](./codex.png)

This repo contains an implementation for the next generation of the DeSci protocol, built on [Ceramic](https://ceramic.network/). The system uses the high-performance [Ceramic-one](https://github.com/ceramicnetwork/rust-ceramic) node, with legacy ComposeDB support being phased out. It includes data models, P2P networking for content replication, and a test suite to ensure adherence to the spec.

## Packages

The monorepo consists of several packages:
- [**models**](./packages/models/README.md) - Ceramic model definitions and deployment tooling
- [**node**](./packages/node/README.md) - Codex node for P2P data replication and IPFS pinning
- [**lib**](./packages/lib/README.md) - Integration library with typed APIs for Codex interaction
- [**metrics_server**](./packages/metrics_server/README.md) - Backend for collecting and serving node metrics
- [**composedb**](./packages/composedb/README.md) - ComposeDB models and test environment (deprecated)


# Running a node
For documentation on how to run your own Codex node, see the docs [here](./packages/node/README.md)

# Protocol documentation
The protocol documentation can be found [here](https://codex.desci.com)!

## State of models
There is still iteration on the design of the models as we are starting with backwards-compatible rollout on the ResearchObject with intact manifests. As we experiment with putting more and more of the manifest content on streams, the model design will stabilise.

**Alpha** means that the model, and hence the ID, will likely change.
**Beta** means that the model is somewhat stable, but there may be an upgrade requiring a migration.
**Stable** means the model is stable, and if any change is necessary we are committed in solving for backward compatibility.

| Model                 | Status | ID (Clay)                                                       | ID (Mainnet) |
|-----------------------|--------|-----------------------------------------------------------------|--------------|
| ResearchObject        | beta   | kjzl6hvfrbw6cbe01it6hlcwopsv4cqrqysho4f1xd7rtqxew9yag3x2wxczhz0 | Same         |
| Profile               | alpha  | kjzl6hvfrbw6cba0l4xuvi4ll36h3s21kcau1wpq51ha6k8ttc8yw5kzx2g40in | N/A          |
| Claim                 | alpha  | kjzl6hvfrbw6c6hz18jqthpsvvjvixg8xkvrec10l5nbwqc67vi6lvhgkc7j0ti | N/A          |
| Attestation           | alpha  | kjzl6hvfrbw6c9gw5pagxy4ig2f9lqpexycdl5lq9jfy11itm38f3nco4ud8699 | N/A          |
| ResearchComponent     | alpha  | kjzl6hvfrbw6c9mh61r73r6o7lfmo8u7d2ygka8yqgwn4wwtl45xsv51uds87dh | N/A          |
| SocialHandle          | alpha  | kjzl6hvfrbw6c6t1shl3fextieopqswv96xuhmfh4c3h66eqj3zx3ivddg9axq2 | N/A          |
| Annotation            | alpha  | kjzl6hvfrbw6c5j2xqk6s2hraoxs49pk1hfsrj6ht5tqmqhwupqarjvafx9l6n6 | N/A          |
| ContributorRelation   | alpha  | kjzl6hvfrbw6c5qmeyibuvf351c9gcpmbvjmclzgz74wwskd8pr3jzuy8anvz1h | N/A          |
| ReferenceRelation     | alpha  | kjzl6hvfrbw6cackjf6z5qcaz9zhh9sezssa7usx4r9rc7to5xowogxr3ssbpor | N/A          |
| ResearchField         | alpha  | kjzl6hvfrbw6caae58yly0aahfzqewu1dfhlc00042i08wg4anar5xj7lbahzz8 | N/A          |
| ResearchFieldRelation | alpha  | kjzl6hvfrbw6c7aug8sphy4eae684t9wbqb5g15r0grssurt51sllba689318co | N/A          |


## Getting started

### Prerequisites

- Node.js v22+ (use `nvm use`)
- pnpm v10+
- Docker & Docker Compose

### Installation

```bash
nvm use # or otherwise ensure Node v22
pnpm install
```

### Running Services

To run your own Codex node, you can use these commands.

#### Quick Start with Docker

```bash
# Start Ceramic-one + Codex node (clay testnet)
./docker/run-dev.sh dev

# Start with metrics collection (clay testnet)
./docker/run-dev.sh dev-metrics

# View logs
./docker/run-dev.sh logs

# Stop all services
./docker/run-dev.sh stop
```

#### Default service URLs

- **Ceramic-one RPC**: http://localhost:5101
- **Ceramic-one FlightSQL**: http://localhost:5102
- **Codex Node API**: http://localhost:3000
- **Metrics Server**: http://localhost:3001 (when enabled)

For detailed Docker configurations, see the [docker documentation](docker/README.md).

## Feedback

If you want to discuss any part of the protocol from a practical or theoretical perspective, come on in to our [Discord](https://discord.gg/A5P9fgB5Cf)! This is a community effort, and your thoughts and opinions will help shape its future.
