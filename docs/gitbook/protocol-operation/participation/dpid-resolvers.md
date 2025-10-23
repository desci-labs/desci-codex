---
description: Short, persistent identifiers for the protocol
---

# 🗺️ dPID resolvers

While the protocol already has globally unique, versionable, persistent identifiers for publications, they are quite verbose, being based on content hashing. The dPID system allows minting human-readable identifiers, which is the main way to reference publications on Codex.

[dpid.org](https://dpid.org) is the canonical resolver which is maintained by DeSci Labs, but you can easily host your own. Visit the [browse page](https://dpid.org/browse) to explore content published on Codex.

## Implementation
The dPID registry is implemented in a decentralised fashion as a smart contract, which permanently maps a human-readable PID to a Codex reference. This contract is open for anyone to interact with, the protocol data is open, and the [dPID resolver](https://github.com/desci-labs/dpid-resolver) is free, open source software.

Going from dPID URL to content is where the resolver comes in: first finding the correct protocol node from the mapping in the smart contract, then following the steps in [deterministic-resolution.md](../deterministic-resolution.md "mention") to point to the target content.
