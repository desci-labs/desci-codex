---
description: Additional layers of query power
---

# 🧲 Advanced indexing

Even if the protocol implementation ideally has support for querying graph nodes and the relations between them, there will likely be a need for arbitrarily complex queries against the protocol data. This is where advanced indexers comes in.

## Metadata queries

The metadata attached to research objects, components, and annotations together form a rich picture of publications. Since individual metadata keys aren't queryable at the protocol level, it needs to be complied and indexed for searching. An indexer can map all relevant metadata contributions to the IDs of their targets, and allow graph queries or search by schema.

This also opens for implementation of the [#fluid-metadata-vision](../../data-layer-definition/metadata.md#fluid-metadata-vision "mention") described earlier, where experimentation in indexing will likely lead to solutions that can be standardized in the protocol.

## Natural language queries

Building semantic embeddings for graph entries would allow developments like running LLM queries against research content, effectively allowing users to chat with publications to understand their meaning.

## Full text search

Ingesting the content of publications into something like Elasticsearch would allow freely querying the graph by text, looking for particular pieces of code or mentions of certain terms.
