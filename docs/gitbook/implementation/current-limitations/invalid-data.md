---
description: Voluntarily inflicted self-harm
---

# 🧐 Invalid data

While it is possible for an actor to create semantically incorrect entries in the graph, this is not taken into consideration when discussing the mechanics of querying the graph. For example, there is no way of preventing non-resolvable data DAG from the properties of IPFS and IPLD. However, if it was correct at one point, that particular version can still be resolved retroactively. That means that any reference made to a semantically correct state can never break due to this limitation.

It is the responsibility of gateway operators to make sure the data that is created complies with the semantics of the protocol. This means correctly computing DAG paths, updating components as the user makes changes to the DAG, et cetera.

It's still absolutely possible for an actor to interact directly with the protocol and create unresolvable DAG's or nonsense nodes, but a gateway is also free to build their own definition of what is reliable data. Perhaps that just consists of nodes created from DID's with an associated ORCiD handle, profiles with an attestation from community moderators, or similar rules. The protocol doesn't have an opinion.
