---
description: Social commentary mechanism
---

# 💬 Annotation

An annotation is a localized comment on another entity, which could represent feedback in the case of a review or author arguments explaining why a research component supports the attestation of a claim. Annotations referencing claims can be useful as motivation before an attestation is made, and providing such arguments contributes to user reputation as the discussion is credited.

<figure><img src="../../.gitbook/assets/image (21).png" alt=""><figcaption><p>Annotation thread directly on a research object</p></figcaption></figure>



<figure><img src="../../.gitbook/assets/image (23).png" alt=""><figcaption><p>Publication author motivates the Data Available claim, and receives feedback from a reviewer</p></figcaption></figure>

{% hint style="info" %}
It’s likely that a mechanism for fighting spam will be required in gateways, for example only showing annotations from profiles with a verified identity.
{% endhint %}

## Schema

<table><thead><tr><th width="259.3333333333333">Field</th><th width="130">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>comment</code></td><td><code>String</code></td><td>Contextual commentary</td></tr><tr><td><code>researchObjectID</code></td><td><code>ID</code></td><td>Research object context</td></tr><tr><td><code>researchObjectVersion</code></td><td><code>Commit</code></td><td>Research object version identifier</td></tr><tr><td><code>targetID</code></td><td><code>ID</code></td><td>Which node the annotation applies to</td></tr><tr><td><code>targetVersion</code></td><td><code>Commit</code></td><td>Version identifier of the same</td></tr><tr><td><code>dagNode</code></td><td><code>CID</code></td><td>Optionally reference a node in the DAG</td></tr><tr><td><code>pathToNode</code></td><td><code>String</code></td><td>unixFS path to <code>dagNode</code> (it's not necessarily unique)</td></tr><tr><td><code>locationOnFile</code></td><td><code>String</code></td><td>Optional location specifier on the file in question</td></tr><tr><td><code>claimID</code></td><td><code>ID</code></td><td>Optional mention of a claim</td></tr><tr><td><code>claimVersion</code></td><td><code>Commit</code></td><td>Claim version identifier</td></tr><tr><td><code>metadataPayload</code></td><td><code>String</code></td><td>Optional suggested metadata JSON patch, in the case the target entity has such</td></tr></tbody></table>

### Comment

Textual commentary in the shape of feedback, arguments for claims, questions for authors, and similar type of information.

### Path

If the annotation target is a research component, the annotation author can further specify the location that the annotation refers to. A standard for the different media types is yet to be set, but here are some illustrative examples:

<table><thead><tr><th width="246">Media type</th><th>Path syntax</th></tr></thead><tbody><tr><td><code>text</code></td><td>Line and column number</td></tr><tr><td><code>appplication/pdf</code></td><td>Page index and X/Y percentage coordinates for a selection</td></tr><tr><td><code>video</code></td><td>File timestamp</td></tr><tr><td><code>application/json</code></td><td>JSONPath</td></tr></tbody></table>

### Metadata payload

The annotation can attach a suggested delta to the metadata. This is useful for suggesting adding, modifying, or removing metadata entries. The suggestion is credited to the annotation author, but it's up to the target owner if they choose to apply the suggestions. Regardless, the suggestion is still available. The exact specification of this format is pending, but likely some representation of a JSON CRDT patch.

### Annotation targets

Annotations can technically target any type of protocol entity, but there are some particularly obvious applications.

#### Research object

The annotation is considered to apply to the entire research object. This can be used to leave feedback or questions for the author. A valid assignment has these fields set:

<table><thead><tr><th width="315">Field</th><th>Set?</th></tr></thead><tbody><tr><td><code>researchObjectID</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>researchObjectVersion</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>targetID</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr><tr><td><code>targetVersion</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr><tr><td><code>dagNode</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr><tr><td><code>pathToNode</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr><tr><td><code>locationOnFile</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr></tbody></table>

#### Research component

The annotation is related to the research object context, but refers to a specific research component. This can be used to leave feedback, but also to submit a metadata delta for the author to consider. A valid assignment has these fields set:

<table><thead><tr><th width="313">Field</th><th>Set?</th></tr></thead><tbody><tr><td><code>researchObjectID</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>researchObjectVersion</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>targetID</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>targetVersion</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>dagNode</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span> (transitive from component)</td></tr><tr><td><code>pathToNode</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span> (transitive from component)</td></tr><tr><td><code>locationOnFile</code></td><td>Depends: on the file itself or a particular section</td></tr></tbody></table>

#### DAG node (file in tree)

The annotation is related to the research object context, but refers to a specific file in the tree. This can be used to leave feedback or questions on a paper, a piece of code, or part of a dataset. A valid assignment has these fields set:

<table><thead><tr><th width="312">Field</th><th>Set?</th></tr></thead><tbody><tr><td><code>researchObjectID</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>researchObjectVersion</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>targetID</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr><tr><td><code>targetVersion</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td></tr><tr><td><code>dagNode</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>pathToNode</code></td><td><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td></tr><tr><td><code>locationOnFile</code></td><td>Depends: the file itself or a particular section</td></tr></tbody></table>

{% hint style="warning" %}
Do note that metadata is mainly suggested against components, because that holds the authorative metadata file. A gateway could find and suggest component metadata updates from raw DAG node annotations, or choose to consider it community contributed metadata.
{% endhint %}

#### Annotation (a reply)

The annotation is related to the research object and, transitively, the location of the parent annotation. This can be used to reply to feedback or questions. A valid assignment has these fields set:

| Field                   | Set?                                     |
| ----------------------- | ---------------------------------------- |
| `researchObjectID`      | :white\_check\_mark:                     |
| `researchObjectVersion` | :white\_check\_mark:                     |
| `targetID`              | :white\_check\_mark: (parent annotation) |
| `targetVersion`         | :white\_check\_mark: (parent annotation) |
| `dagNode`               | :x:                                      |
| `pathToNode`            | :x:                                      |
| `locationOnFile`        | :x:                                      |

## Public and private workflows

In some applications of annotations, it may make sense for the content no to be available until a later point in time. Examples of this could be anonymous peer review, non-public conversation, et cetera. In this case, created annotations could be anchored according to the Sidetree implementation, but its content not made publicly available. That allows the content to be revealed later, with proofs of who authored what and when it was created.

## Visibility

Not all authors may want public commentary on their works, in which case gateways could decide to only show annotations made on entities where the creator has selected to accept this. This is a gateway implementation detail, as the underlying data graph is permissionless and has no notion of blocking data contribution from authors.
