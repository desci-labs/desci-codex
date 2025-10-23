---
description: Contribute to the maintenance of the protocol
---

# 📚 Network operators

Being a protocol operator means taking part in the pinning and indexing publications, and therefore helping ensure the longevity of the scientific record. This entails running a node that is listening for network events, pinning the data making up the graph itself, and maintaining an index over existing content. Operators doing this work serve as the persistence backbone of the protocol, from which other nodes can sync data to participate in network operation. It does not necessarily mean serving publishing or data queries, nor pinning the publication data associated with the research object. This is because the data can be very large, and is taken care of by network actors providing [data-services.md](data-services.md "mention").

Gateways, or user-facing applications, with a need for frequent anchoring requests and complex queries run their own nodes to support these requirements. Ideally also serving the public to some extent, fulfilling the role of simultaneously being a network operator. These incentives are aligned, because their business depends on the longevity and trustworthiness of the protocol.

## Protocol data definition

The data in fields as defined by the entity schemas need to be persisted. This includes following all CID's and pinning the underlying data, like metadata records, for example. When a node is updated, the data of previous versions must still be persisted to maintain the record of versions.

It does not include recursively pinning the data DAG found inside the research object manifest, as this content is considered research artifacts and are maintained through [data-services.md](data-services.md "mention") due to size. The manifest holds a CID to this DAG, which is enough to ensure verify correctness when it is available.

A rule of thumb is that all versions of the data DAG _should_ always be resolvable in the network, but it is the responsibility of the network operators to make sure that all versions of anything else _**must**_ be resolvable.
