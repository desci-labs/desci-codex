---
description: Indication that a research object is part of a particular field
---

# 💫 Research field

To aid navigation and indexing, actors can create edges indicating association with particular fields of research. Through these relations, indexers can allow filtering research that is part of both neuroscience and economics, for example.

<figure><img src="../../../.gitbook/assets/image (24).png" alt=""><figcaption><p>Research field relations modelling groups of research objects</p></figcaption></figure>

{% hint style="info" %}
Since any actor can create these relations, a gateway operator may choose to only show such indications created by the publication author or an otherwise trustworthy actor.
{% endhint %}

## Schema

<table><thead><tr><th width="170.33333333333331">Field</th><th width="127">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>name</code></td><td><code>String</code></td><td>Name of the research field</td></tr><tr><td><code>description</code></td><td><code>String</code></td><td>Description of the same</td></tr></tbody></table>

## Governance

To avoid multiple research field instances intending to capture the same, and hence fragmenting the graph, ideally the community adhere to a standardized list. This prevents the same research field existing with different descriptions, which in the end makes indexing more difficult and is confusing to end users.

The DeSci Foundation aims to maintain such a set of research field instances based on the [FAIRsharing Subject Ontology](https://www.ebi.ac.uk/ols/ontologies/srao). This is recommended to use as a whitelist for gateway operators when displaying research fields or allowing the creation of such relations.
