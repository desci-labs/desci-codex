---
description: A rich, living repository of arbitrary metadata
---

# 🏷️ Metadata

The different protocol entities, or types of nodes in the graph, express the main relationships necessary to identify and find the context of research publications. This does not mean that this graph limits what metadata can exist for a publication and its surrounding artifacts. On the contrary, there is likely no more capable system for collaboration on unbound metadata in existence. This is because the protocol allows unrestricted metadata to be associated with both graph nodes and arbitrary IPFS CID's, curated by the community and freely available under persistent identifiers.

## Author controlled metadata files

Some entities have a `metadata` field, holding the CID of a metadata file scoped over the entity. There is no technical limitation to the format of the content, nor preventing following multiple schemas within the file, separated by a delimiter. The protocol is agnostic to the shape of the data, it only knows about a generic file reference. The user who created the node can update the information in this file freely, but all historical versions are preserved as part of the protocol.

A [research-object.md](entities/research-object.md "mention") have this file associated, and is under direct control of the author. The author can also create a [research-component.md](entities/research-component.md "mention") for particularly interesting files in the research object, which holds the same type of file.

Both research objects and components can be targeted with annotations holding metadata payloads, deltas that suggest addition, update, or removal of pieces of the metadata. The author can accept these to patch target nodes, publish it in a new version together with metadata contributor relations to the annotators:

<figure><img src="../.gitbook/assets/image (5).png" alt=""><figcaption><p>An annotation suggesting a metadata patch on a research component made by the publication author.</p></figcaption></figure>

Since components and the associated metadata is bound to a particular CID, it's easily found for another author making a publication using the same dataset. A publishing gateway can find this component and propose the information from that component to the author:

<figure><img src="../.gitbook/assets/image (4).png" alt=""><figcaption><p>Thanks to content addressing, metadata from shared datasets can be reused and suggested to authors by the publishing gateway.</p></figcaption></figure>

## Community curation

Annotations can be used to expand and enrich metadata in the context of research objects and components, but the annotation entity is very expressive on its own. They can attach metadata payloads to arbitrary nodes in the data DAG of any research object, which means every single file and directory included in a publication could have its own set of metadata. The annotations can even be localized inside the files, contributing metadata to a particular figure inside a paper. Even if the author does not acknowledge and merge the suggestions, the metadata edits are still there as standalone nodes and can hence be indexed and displayed as community contributed suggestions.

## Fluid metadata vision

The annotation entity supports another scenario where there are no authoritative metadata definitions at all. Annotations can attach payloads in the form of [JSON CRDT patches](https://github.com/streamich/json-joy), a [conflict-free replicated datatype](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) implementation, which together would yield the current state of metadata. This would remove the notion of a static metadata definition under central control, and instead work by deterministically reducing a collection of metadata fragments into a cohesive document.

<figure><img src="../.gitbook/assets/image (6).png" alt=""><figcaption><p>JSON CRDT patch based metadata curation, where there would be no metadata directly on any entity, but only compiled from annotation suggestions.</p></figcaption></figure>

There are some open questions left before this idea can become reality, mainly regarding indexing stability, deterministic history resolution, and the effect of bad actors.

## Indexing system

All metadata files are stored on IPFS because the size is unbounded, which does not mesh well with Sidetree. Having the metadata as fields in the graph data would add considerable overhead to the operation of the protocol, several orders of magnitude in the case of large metadata collections.

The fact that these metadata files are stored on IPFS means that querying content by metadata requires an indexing layer to be practical. Such an implementation is comparatively simple when the data is openly available and content addressable. For a given version of a research object or component, there is a definitive state bound to that version, meaning it can never go stale. For free-floating community curated metadata payloads, these can be indexed separately to allow for choosing whether they should be included in the search or not.

A rough sketch of the implementation of an index:

* The service listens for protocol events updating metadata
* For each update where the metadata CID has changed, fetch the new content from IPFS
* Update the index for the given target with the new metadata entries

With this dataset constructed, arbitrary queries can be run over the metadata. Searching metadata by free text or by schema would both be possible.
