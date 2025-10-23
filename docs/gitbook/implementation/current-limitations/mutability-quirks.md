---
description: When mutability and determinism collide
---

# 🤞 Mutability quirks

The protocol builds on community graph contributions, and while each graph entry has a verifiable version history, there are a couple of cases where mutable streams and historical accuracy don't mesh very well. In general, the protocol strives for simple access to latest state while maintaining the possibility to deterministically and recursively resolve the state at some particular point in time. ComposeDB currently solves the first part with excellence, but for the second things are a bit less clear.

It's worth pointing out that these quirks and issues are related to ComposeDB _indexing_. The underlying stream data is still correct, but resolution is closer to the more complex cases described in [deterministic-resolution.md](../../protocol-operation/deterministic-resolution.md "mention") and hence linear, or worse, in computational complexity over potentially large amounts of nodes.

Let's look at a few cases where there is unexpected behavior from the point of view of the protocol. It's not necessarily incorrect from the Ceramic/ComposeDB point of view, but still a strong usability hurdle for the use case.

## Unreliable incoming edges

Incoming edges are made by the referrer node having a `StreamID` field targeting the referee node. Using the `@relationFrom` directive, ComposeDB will maintain an index of such incoming fields. This makes resolution very efficient, as it becomes a more or less constant time operation.

However, this index is based on the latest state of each node. If the referrer node updates the `StreamID` field to point to some other node, the previous edge will disappear from the referee index. Conversely, the new target node now suddenly shows a relation from a node which historically hasn't referred to it.

This is _very bad,_ as ComposeDB now returns a structurally different graph for a query of the same nodes.&#x20;

The biggest consequence of this is that ComposeDB diverges from what is the expected state according to our protocol, making it hard to trust the bare GraphQL API without an extensive validation strategy.

{% hint style="info" %}
The fact that other fields are mutable isn't an issue, because if we can rely on at least finding the node, we can easily show the edit history.
{% endhint %}

### Problem instances

This problem is present in all models where there are outgoing edges, because these are always indexed as incoming in others:

* Research components (`researchObjectID`)
* Attestations (`targetID`, `claimID`)
* Annotations (`researchObjectID`, `targetID`, `claimID`)
* Contributor relations (`researchObjectID`, `contributorID`)
* Reference relations (`toID`, `fromID`)
* Research field relations (`researchObjectID`, `fieldID`)

### Suggested solution

A new type of account relation, `SET`, is planned by the Ceramic team. When it will arrive is still unclear. It enables listing some fields in models which can only be set at the time of creation of a node, as they are used to determining node uniqueness for the account. This would efficiently eliminate most, if not all, of these cases since a `StreamID` couldn't be changed.



Without this, the only way to re-establish trust in incoming relations is to maintain a complete index over every state of every valid source, and use this in two ways.&#x20;

The first, which isn't too bad, is to figure out if existing incoming relations are historically accurate, by checking the history for changes to the `StreamID` field for every referrer.&#x20;

The second, which is far worse, is figuring out if there are _missing_ incoming edges. The only way to do this is to exhaustively search all versions of all potentially valid referrer nodes to see if they at some point in time were redirected away from this node.

{% hint style="info" %}
With the SET relation, there is still a possibility to update the entire stream state to `null`. There is a separate discussion around adding a `@setOnCreation` field directive, which would also prevent state nullification.
{% endhint %}

## Unversioned edges

A related issue also stems from ComposeDB exclusively returning the most recent versions of nodes when executing queries. This means that we cannot use ComposeDB for historical resolution, but need to rely on the Ceramic HTTP API and resolve it manually. This is not an edge case, but the most common operation when querying the scientific record because the state at time of publication is important:

* Who were contributors in the first version?
* What attestations were awarded by the first review?
* Which authors pointed out the missing data in this version?

### Suggested solution

Being able to query ComposeDB by `CommitID` and with `atTime` constraints would prevent having to manually index previous versions of known nodes to enable finding answers to these questions. The alternative is to accept the overhead of looking up the historical state with the Ceramic HTTP API, and doing follow-up queries to follow versioned references.

The dream scenario, ComposeDB allowing relations on `CommitID` fields, would be absolutely massive in this use case. Being able to follow versioned relations recursively would greatly simplify historical resolution.
