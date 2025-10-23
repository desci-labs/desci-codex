---
description: >-
  Directional link between research object and profile, indicating a
  contribution.
---

# 🤝 Contributor

Relates a profile to a research object and indicates a contribution to the value of the publication.

<figure><img src="../../../.gitbook/assets/image (25).png" alt=""><figcaption><p>An author-made contributor relation pointing to another user's profile</p></figcaption></figure>

{% hint style="info" %}
Since any actor can create these relations, a gateway operator may choose to only show such indications created by the publication author or an otherwise trustworthy actor.
{% endhint %}

## Schema

<table><thead><tr><th width="266.3333333333333">Field</th><th width="134">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>role</code></td><td><code>String</code></td><td>Role filled by the contributor</td></tr><tr><td><code>researchObjectID</code></td><td><code>ID</code></td><td>The research object contributed to</td></tr><tr><td><code>researchObjectVersion</code></td><td><code>Commit</code></td><td>Version when this relation was created</td></tr><tr><td><code>contributorID</code></td><td><code>ID</code></td><td>The profile of the contributor</td></tr><tr><td><code>fallbackInfo</code></td><td><code>String</code></td><td>JSON data with social handles, in case contributor does not have a profile</td></tr><tr><td><code>revoked</code></td><td><code>Boolean</code></td><td>Indicate if this contributor relation has been revoked.</td></tr></tbody></table>

### Roles

To the largest possible extent, the contributor's role should be set according to [CRediT](https://credit.niso.org/), the Contributor Roles Taxonomy. This is to reduce the number of different values, making indexing easier. The linked page has definitions for each of the 14 contributor roles, with descriptions on what classifies as that type of contribution. If there is the need to use some other role identifier, that is still possible.

### Contributors and profiles

If the contributor has created a profile in the protocol, it's advantageous to refer directly to that because the contributor can update their social handles and other information. Additionally, it makes it easier to find their own work and other contributions if there is an explicit link.

Otherwise, the `fallbackInfo` field allows a key-value map in JSON format for listing the contributor's handles on services like ORCiD, Google Scholar, etc.

### Revocation

Since entity instances can be updated, but not deleted, the way to recall a contributor indication is by updating this field to `true`. Gateways should respect this and mark it as revoked from the version where it happened.
