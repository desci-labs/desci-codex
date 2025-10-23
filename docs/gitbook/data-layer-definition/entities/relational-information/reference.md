---
description: Directional link between two publications indicating scientific dependence
---

# 👉 Reference

Relates a research object with another, indicating that the result depend on or is related to the target publication. The exact meaning of this relation depends on the author intention, in the same way as a reference in a classical paper does.

Having dedicated entities for references, instead of text based equivalents in the paper, enables querying the scientific record based on direct or transient reference relations.

<figure><img src="../../../.gitbook/assets/image (26).png" alt="" width="342"><figcaption><p>Reference relations, showing transient references between three publications </p></figcaption></figure>

{% hint style="info" %}
Since any actor can create these relations, a gateway operator may choose to only show such indications created by the publication author or an otherwise trustworthy actor.
{% endhint %}

## Schema

<table><thead><tr><th width="180.33333333333331">Field</th><th width="137">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>fromID</code></td><td><code>ID</code></td><td>Research object at the source of the reference</td></tr><tr><td><code>fromVersion</code></td><td><code>Commit</code></td><td>Version indicator of the same</td></tr><tr><td><code>toID</code></td><td><code>ID</code></td><td>Research object at the target of the reference</td></tr><tr><td><code>toVersion</code></td><td><code>Commit</code></td><td>Version indicator of the same</td></tr><tr><td><code>revoked</code></td><td><code>Boolean</code></td><td>Revokation status</td></tr></tbody></table>

### Revocation

Since entity instances can be updated, but not deleted, the way to recall a contributor indication is by updating this field to `true`. Gateways should respect this and mark it as revoked from the version where it happened.
