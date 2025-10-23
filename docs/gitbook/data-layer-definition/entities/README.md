---
description: High-level overview and charts explaining the grand scheme of things
---

# 👾 Entities

The protocol models the scientific records and all contributions to it as a graph. The reason this representation is chosen is that it enables clear and explicit relations between entries, like the connection between a publication and its author, or a scientific reference between two different publications. Each node in this graph is cryptographically signed by the author of the data, meaning we have verifiable provenance for every contribution ever made.

The schemas, or models, of a node is called an entity, and a user-created entry based off that is called a node. The users of the protocol participate in curating metadata, and populate and enrich research objects. All parts of the graph are user contributions, and the range of available entities can also be extended by the community.

<figure><img src="../../.gitbook/assets/image (1).png" alt=""><figcaption><p>An example of a graph of independent authors, their publications, and the relations between the different types of entities.</p></figcaption></figure>

{% hint style="info" %}
This graph is an initial overview to give some basic understanding of author ownership, collaboration, and the graph concepts that will be mentioned going forward. This may be a new and confusing way to represent things in this space; the main takeaway should simply be thinking about the protocol as a graph.
{% endhint %}

## Field assumptions

Some values are assumed to be present in every instance of every entity type as it is created in the protocol, as they are necessary for verifiable authorship and deterministic resolution:

<table><thead><tr><th width="147">Field</th><th width="132.33333333333331">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>owner</code></td><td><code>DID</code></td><td>Unique identifier of the entity creator</td></tr><tr><td><code>id</code></td><td><code>ID</code></td><td>Unique identifier of this node</td></tr><tr><td><code>commit</code></td><td><code>Commit</code></td><td>Unique identifier of the particular version</td></tr></tbody></table>

## Arguments for fragmentation

Compared to the previous version of the protocol, where all data was kept inside a single manifest file on IPFS, the new version has several entity types which instead hold references to one another to shape the graph. One could argue that this increases complexity because the same data is spread out in different places. This is correct in one sense, but there are multiple arguments to why this design is stronger.

### Extensibility

This fragmentation enables anyone to create a new entity that adds relational information or functionality and connecting it to the data layer with references, or edges, in the graph analogy. This allows the community to retroactively expand context without requiring the original entry to be changed, which is particularly powerful because we can continue to enrich information around unattended entries in the scientific record.

An additional benefit is that there does not need to be agreement on the schema of the manifest. Some independent set of actors can just join forces in creating a new entity and index that, regardless of the opinion of the broader community. Maybe it is then proven to be useful, in which case it is easy for the rest of the community to start indexing that information as well.

### Ease of indexing

Lowering the bar of participation and building supporting services is important for longevity of the protocol. As a concrete example, the [research-field.md](relational-information/research-field.md "mention") entity allows the identifiers of publications in different fields by looking at a very small set of data. Being able to do this without a separate entity would require keeping a database linking every single published manifest with its identifier, and perform a quite computationally intensive search through that data to filter on the author-defined research field. With this dedicated entity, a community member wanting to build a simple website listing links to publications in particular fields will have a much easier time to do so without depending on someone else for the indexing.

### Granular ownership

With each contribution to the scientific record being independently associated with its author, it's simpler to credit activities that are significant but aren't adding to the reputation of the author in the classical system of science. This is an important enabler for building incentives for performing supporting services on the scientific record like community review, data stewardship, improving metadata, and a plethora of other tasks.



The following sub-pages dig into the functionality of each entity of the data layer.
