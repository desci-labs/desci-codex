---
description: >-
  Fractional information about the contents of the data DAG of a research
  object.
---

# 📄 Research component

A component entity provides context to nodes in the data DAG of a research object. This could be to comment on its use, indicate the type of data, give it a descriptive name, and attach arbitrary metadata. The research object author uses instances of these entities to enrich context around important parts of the publication, like a dataset, a paper, or a piece of code.

Other actors can also create component instances to enrich the context of a research object, or to include the same CID's as part of their publications. A user-facing gateway can choose how to reconcile these different sources of information, and potentially use other author's components to suggest metadata for similar files.

<figure><img src="../../.gitbook/assets/image (30).png" alt=""><figcaption><p>A visualization of the relationships between research objects, its components, and individual files on IPFS</p></figcaption></figure>

{% hint style="info" %}
Since any actor can create instances of a research component, it's likely that a gateway operator only will show those who are created (or accepted) by the DID that published the research object.
{% endhint %}

## Schema

<table><thead><tr><th width="264.3333333333333">Field</th><th width="111">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>name</code></td><td><code>String</code></td><td>Descriptive name of the component</td></tr><tr><td><code>mediaType</code></td><td><code>String</code></td><td><a href="https://www.iana.org/assignments/media-types/media-types.xhtml">Media Type</a> indicating the type of data</td></tr><tr><td><code>researchObjectID</code></td><td><code>ID</code></td><td>Unique identifier of the target research object</td></tr><tr><td><code>researchObjectVersion</code></td><td><code>Commit</code></td><td>Unique identifier of the research object version</td></tr><tr><td><code>dagNode</code></td><td><code>CID</code></td><td>Target node inside the data DAG</td></tr><tr><td><code>pathToNode</code></td><td><code>String</code></td><td>The unixFS path through the DAG (since a CID could exist in more than one place)</td></tr><tr><td><code>metadata</code></td><td><code>CID</code></td><td>JSON representation of arbitrary metadata</td></tr></tbody></table>

### Media type

To aid gateways in picking how to represent data, individual files should have information about file type attached. This information isn't otherwise available, part from the extension if that's included in the UnixFS filename field. There is a [rich variety](https://www.iana.org/assignments/media-types/media-types.xhtml) of media types to pick from, and a gateway can implement a fallback representation based on the [top-level type](https://www.rfc-editor.org/rfc/rfc2046.html#section-3) and map specific viewers depending on the subtype. An example of this would be showing `text/*` as regular text, but specialize the view of `text/csv` data as a table.

Since not all file types have a media type, a gateway can also draw conclusions from the file extension. A good example of this are code files in different programming languages. Conversely, not all media types have a singular corresponding file extension, so both sources of information are required to paint a rich picture of the content.

## Motivation of separation from research object

Separating component information from the research object creates a specialized dataset which simplifies reverse CID look-ups, like finding which research that use a particular dataset or contain the same PDF's, and similar questions. Consider the diagram at the top of the page, where we can go through component entities and find which research objects have a particular dataset included in their publication.

The reason this is not embedded directly in the IPLD DAG is that it would change the CID. This would make it difficult both to trace re-use of data in other research objects and reduce usefulness of IPFS deduplication in nodes, which lead to higher maintenance cost for the network.
