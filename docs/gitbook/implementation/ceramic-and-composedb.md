---
description: The choice of underlying data and indexing layer
---

# 🌊 Ceramic & ComposeDB

{% hint style="info" %}
Codex is currently transitioning from the now outdated `js-ceramic` & `composedb` to `rust-ceramic`. This information will be updated when that work is finished.
{% endhint %}


## Ceramic Network

The Ceramic Network has been chosen as the standard implementation of the data protocol, as it fulfills the necessary requirements from Sidetree, but for JSON data, and includes schema validation as part of the node message processing.

Ceramic is a decentralized protocol for creating and updating mutable content on the web. This is a short summary of how Ceramic fulfills the needs for representation of the protocol entities:

1. **Streams**: At the heart of Ceramic are streams – sequences of operations on JSON documents. Each stream has a unique identifier (`StreamID`) and a cryptographically verifiable version history, allowing for updates and revisions over time. We specifically use the `StreamTile` document.
2. **Decentralized Identifiers (DIDs)**: Ceramic uses DIDs for user and data authentication. This means that any update to a stream is cryptographically linked to a DID, ensuring the integrity and provenance of data.
3. **Commit Log**: Every update to a stream in Ceramic is saved as a commit in its commit log. This allows applications and users to query the state of the stream at any point in its history, ensuring full auditability, because every version is uniquely identifiable by its `CommitID`.
4. **Pinning and Storage**: Ceramic uses the IPFS for storing the commit logs. This decentralized storage ensures data permanence and availability.
5. **Schema Enforcement**: Ceramic allows you to enforce schemas on your streams. This can be useful if you want your JSON data to adhere to specific structures or formats, which is what we need to instantiate the protocol entities.
6. **Interoperability**: Ceramic is built on standard protocols like DIDs and IPLD, which ensures a high degree of interoperability with other Web3 systems and data structures.
7. **Decentralization and Security**: Ceramic operates atop various blockchain systems and uses cryptographic methods to ensure data integrity and security. This makes it resistant to censorship and tampering. This means we can use several potential anchoring layers.

## ComposeDB

What Ceramic on it own _doesn't_ provide is a way to index, discover, organize, and query for existing streams (nodes) depending on which schema (entity) they implement, or track references made to other streams. ComposeDB is a type of graph database built on top of Ceramic to achieve all of these properties.\
\
In ComposeDB, we talk about models and nodes instead of schemas and streams. Relations between nodes are called edges, completing the graph analogy.

1. **Model indexing:** ComposeDB will discover and index all streams implementing a particular schema, allowing us to easily query for data without knowing about the streams beforehand.
2. **Graph model:** The data is naturally structured as a graph, where model instances (nodes) can hold edges to other entities. This is how we can query for the content of the `Reference` field type target.
3. **GraphQL API:** Automatically generated GraphQL definitions and a built-in GraphQL server allows easy data access.
4. **Composability:** the way relations are modeled allows retroactively adding indexes to old models without having to re-define them, which is very powerful as it allows the protocol implementation to be easily extended with new entities.

## Mapping

The entity schemas listed generic types for references and version identifiers, as well as other terms. This is how these map to Ceramic and ComposeDB.

| Entity field type | ComposeDB type                                    |
| ----------------- | ------------------------------------------------- |
| `ID`              | `StreamID`                                        |
| `Commit`          | `CommitID`                                        |
| Network node      | ComposeDB or Ceramic node, depending on the query |

## Motivation

To our knowledge, there exists no other Sidetree-esque protocol which allows arbitrary schema validation, automatic indexing and data discovery, append-only operation on mutable references with full historical provenance. It also implements relations in a way that natively supports graph models both from the construction and query perspective. In addition to this, an automatically generated, self-documenting GraphQL API.

Even if organizations with capable engineering departments could build the corresponding feature on top of some other data layer, having batteries included absolutely obliterates the bar of participation in building applications and services on top of the protocol. Another requirement has been removing the need for 1-1 mapping between user actions and blockchain calls, for scalability, cost, and UX reasons.

Another central aspect of ComposeDB, which is hinted at in the name, is composability. There is native support for re-using models defined by others in other contexts, which means anyone can extend the protocol by creating a new type of model which can seamlessly coexist and interface with the existing graph. If such an extension gets enough community support, it can be officially added to the protocol with ease.
