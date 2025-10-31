---
description: HTTP resolver for persistent identifiers
---

# 🗺️ dPID resolver

While the protocol already has globally unique, versionable, persistent identifiers for publications, they are quite verbose, being based on content hashing. The dPID system allows minting human-readable identifiers, which is the main way to reference publications on Codex.

The dPID resolver acts as a HTTP bridge to content resolvable in the protocol, allowing programmatic exploration and resolution of publication data over an user-friendly API.

[dpid.org](https://dpid.org) is the canonical resolver which is maintained by DeSci Labs, but you can easily host your own. Visit the [browse page](https://dpid.org/browse) to explore content published on Codex and see how a dPID can be used to granularly reference any artifact in a publication.

## Implementation
The dPID registry is implemented in a decentralised fashion as a smart contract, which permanently maps a human-readable PID to a Codex reference. This contract is open for anyone to interact with, the protocol data is open, and the [dPID resolver](https://github.com/desci-labs/dpid-resolver) is free, open source software.
