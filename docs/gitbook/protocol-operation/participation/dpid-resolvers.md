---
description: Short, persistent identifiers for the protocol
---

# 🗺️ dPID resolvers

While the protocol already has unique and persistent identifiers for nodes (including versioning), they are quite verbose, being dependent on hashing. The separate [dPID](https://www.dpid.org/) system allows claiming a short identifier. This is done in a smart contract, which permanently maps the PID to a node in the protocol graph. This contract is open for anyone to interact with, the protocol data is open, and the resolver service will be released as free, open source software.

Going from dPID URL to content is where the resolver comes in: first finding the correct protocol node from the mapping in the smart contract, then following the steps in [deterministic-resolution.md](../deterministic-resolution.md "mention") to point to the target content.

[dpid.org](https://dpid.org) is one such operational resolver, but for resilience there is a need for more of them. If one resolver is down because of technical issues, the company running it no longer exists, or similar reasons, one just needs to use a different resolver to fetch the same dPID.

{% hint style="info" %}
The dPID registry is currently operating according to the previous version of the protocol, and a planned future upgrade is required for supporting identifiers of the protocol implementation. When this is done, a resolver application ready for deployment will be released with a free license.
{% endhint %}
