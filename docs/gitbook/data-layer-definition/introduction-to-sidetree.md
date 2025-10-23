---
description: A primer on the required capabilities of implementing technologies
---

# 🌳 Introduction to Sidetree

{% hint style="warning" %}
This section introduces some underlying base properties necessary for practically implementing the protocol. This is not required to get the gist of , so it can be safely skipped if a general overview is the goal of your read.
{% endhint %}

The protocol is a graph abstraction, but there are certain base properties that need to be supported by the implementation for the requirements laid out in the [design-goals.md](../desci-codex/design-goals.md "mention") to hold. These properties partially overlap with the definitions made in the [Sidetree Protocol](https://identity.foundation/sidetree/spec), which is practical as a common language in this specification.

Sidetree is a higher order protocol, i.e., lays out shared definitions and necessary properties for an implementing protocol to achieve certain outcomes. It is originally intended for decentralized public key infrastructure, but one can generalize the concept and apply the pattern for other types of documents.

The basics of Sidetree is that nodes in a network collaborate to keep track of sequential updates to documents made by end users, in a trustless fashion. An end user who wants to update their document announces this to a node in the network, which verifies that the cryptographic signature of the update corresponds to the one who created the original document. If this is the case, the node includes a persistent identifier of the update message in a tree that is posted to a decentralized anchoring layer, like a blockchain. What's important here is that each single transaction is recorded in the anchoring layer in large batches, enabling great reduction in throughput and cost.

The nodes in the network communicate about new events they have received. As nodes learn about a new update, they can verify that it is indeed authentic, and check a proof of inclusion in the public ledger. By sharing and verifying document updates in this way, the network reaches consensus of what is the latest state of a document without having to establish trust.

## Central properties

In the Sidetree summary above, there are several essential properties that the DeSci Codex leverages in order to meet its design goals.

### Verifiable authorship

This means that each and every user interaction within the protocol needs to be cryptographically signed to establish provenance. Without this property, one could never be sure if an action was really taken by the assumed person or that data hasn't been tampered with.

### Anchoring scheme

Time and ordering are both difficult problems in decentralized systems, and to reach global consensus we require protocol nodes to anchor the received events in a public, immutable, append-only anchoring layer. It is not scalable for every node to hold the entire state of history, so it needs to be possible to validate inclusion in constant time and space. This is generally achieved with just posting the root hash of a Merkle tree and just announces a small [Merkle proof](https://computersciencewiki.org/index.php/Merkle_proof) of the inclusion which is easy to verify.

All in all, the main takeaways from the anchoring scheme are:

1. Avoiding rampant storage swell on the anchoring layer through a minimal and efficient method of proving inclusion.
2. Avoiding direct user interaction with the anchoring layer, which is in general much slower than any Sidetree based protocols.

### Versioning

As every author-verified update request to the state of a document is cryptographically tied to the previous version and independently anchored, we have an ordered history of updates to each document. This is very important for being able to persistently identify the state of a document at a certain point in time, which is a key attribute necessary to reach our design goals.

This is what allows us to maintain a record of versions, compared to the current singular version of record that is the industry standard.

## Adapted terminology

Sidetree uses the DID suffix for document identifiers and a value called the commitment for operations. In the protocol, we will refer to them as identifiers and commits. Additionally, we only consider `Create` and `Update` operations as `Recover` and `Deactivate` does not make sense in this context.

We will also talk about different entities, which can be considered schemas of data nodes in the graph. This is analogous to a Sidetree node handling different types of documents, and validates the schemas of each type.

## Note on indexing

Partly simplified but otherwise accurate, the Sidetree spec is only concerned with validation and consensus and leaves no details on efficient indexing and querying for data in documents. This is an implementation detail which is solved under different constraints depending on the implementing protocol, but is a significant consideration when choosing the underlying technology to back the DeSci Codex.
