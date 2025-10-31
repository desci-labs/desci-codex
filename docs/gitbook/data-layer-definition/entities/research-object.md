---
description: The main reference to a publication and its version history
---

# 📗 Research object

The core of the protocol is the research object, a container for a publication and its arbitrary associated artifacts with a public and deterministically resolvable version history. Everything else in the protocol exists to enrich the context around the research object, giving access to unparalleled analytics and mechanisms for scientific review, while having to place trust in neither central points of failure nor authority.

The main purpose of a research object is to keep a reference to a tree of arbitrary data. This can be thought of as a hierarchy of files just like in your personal cloud storage, but publicly available on IPFS. In the ideal case, this tree would contain a research paper, presentations, code, and the data necessary to explain and reproduce the claims of the publication.

The research object is mutable in the sense that it can be updated to add additional files or metadata, but static in the sense that every version has its unique identifier and is independently traceable through the protocol.

<figure><img src="../../.gitbook/assets/image (29).png" alt=""><figcaption><p>A research object entity and a visualization of it's link to the data DAG</p></figcaption></figure>

## Schema

<table><thead><tr><th width="160">Field</th><th width="105.33333333333331">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>title</code></td><td><code>String</code></td><td>Title of the publication</td></tr><tr><td><a href="research-object.md#the-manifest"><code>manifest</code></a></td><td><code>CID</code></td><td>Instance of a <a href="https://github.com/desci-labs/nodes/blob/5028c15c90dc533d257b4d343cbc92b68dda27e5/desci-models/src/ResearchObject.ts#L18">manifest</a>, initially <code>0.2.0</code></td></tr><tr><td><a href="research-object.md#attached-metadata"><code>metadata</code></a></td><td><code>CID</code></td><td>JSON representation of arbitrary metadata</td></tr></tbody></table>

### The manifest

The `manifest` field holds a CID to a JSON file which contains a pointer to the data DAG as well as information about the research object itself. The manifest has a self-documenting version field, and is initially an instance of [`desci-nodes-0.2.0`](https://github.com/desci-labs/nodes/blob/5028c15c90dc533d257b4d343cbc92b68dda27e5/desci-models/src/ResearchObject.ts#L18). Hence, a research object created using the old manifest format is valid and can easily be identified. The reason for this being the initial default is to maintain backward compatibility, while also enabling contextual information as data entries in the protocol. As the protocol matures and the representation of contextual data therein stabilizes, simplified manifest schemas can be released to eliminate this duplication.

The data DAG, known as the `DATA_BUCKET` component in the manifest format, is the root CID of an [UnixFS](https://github.com/ipfs/specs/blob/main/UNIXFS.md) IPLD data structure. This can represent any hierarchy of arbitrary serialized data, comparable to the classic file system abstraction. Here is an example UnixFS DAG, encoding a directory holding three files with name and size:

{% code title="Example " fullWidth="false" %}
```json
{
  "Data": {
    "/": {
      // unixFS protobuf encoded directory indicator
      "bytes": "CAE"
    }
  },
  "Links": [
    {
      "Hash": {
        "/": "bafybeiggs56o2lfnokepfnhllazq4pgohmdnmsdjrjdbxsyntmq2zlktri"
      },
      "Name": "chan_l6_4x12x24_4x4x8.h5",
      "Tsize": 10626444
    },
    {
      "Hash": {
        "/": "bafybeibeaampol2yz5xuoxex7dxri6ztqveqrybzfh5obz6jrul5gb4cf4"
      },
      "Name": "chan_l6_4x12x24_6x6x12.h5",
      "Tsize": 35847020
    },
    {
      "Hash": {
        "/": "bafybeibvt5s7scy6lvu6v5r3w2oiliti326ddtpx3hhtvphxpxpaeoiy2i"
      },
      "Name": "chan_l6_4x12x24_8x8x16.h5",
      "Tsize": 84960093
    }
  ]
}
```
{% endcode %}

### Attached metadata

The `metadata` field holds minified JSON, the specific format of which is not strictly defined. This metadata file holds all properties that may be required in particular research fields, certain regulations, by specific journals, or other standards.

Most of this information will not be set by hand, but either automatically compiled by the publication gateway or suggested by other actors in the protocol, for the owner of the research object to accept. We will return to this concept of metadata contributions later, in the [annotation.md](annotation.md "mention") chapter. A full summary of the metadata capabilities can be found in [metadata.md](../metadata.md "mention").

## Self-sufficiency

One could view this entity as the only primitive of the protocol, and all other as extensions. In fact, all other entities could have been created by the community.

Additionally, to reach functional parity with the previous generation of dPID resolution (details of which we will get into later) we only need the Research Object entity holding a manifest CID to keep track of the entire record of versions.
