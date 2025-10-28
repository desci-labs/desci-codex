---
description: Wanted functionality that is still further away
---

# 🧩 Feature wishlist

## Fork & merge

Being able to fork a publication, make changes, and send it to the original author as a merge request would enable git-like collaboration. By having a relation created by the forker to indicate provenance and a relation created by the merger to indicate application, there would be a branching history to explore behind collaborative research projects.

Possibly a prerequisite to this, depending on implementation, would be [CRDT](https://crdt.tech/) representation of content to make sure it can be cleanly applied.

## Nanopublications

The protocol can represent nanopublications in different ways already:

1. A slim research object containing small files for each publication
2. Tied to larger research objects as annotation metadata payloads

However, the usefulness of nanopublications at scale depends on being able to expressively query and calculate probability distributions over the assertions. There may be a need for purposeful entities built for this purpose, being able to represent both contextual (i.e., breakdowns) and stand-alone assertions in the same data type. This would make it easier to query nanopubs specifically, without needing to consider the rest of the graph at that stage.

## Organization management

Being able to manage organizations, its members, and delegation of power would enable very interesting applications. Parts of this can be done in the gateway layer, but there may need to be support for certain representations in the protocol as well.

## Multi-author publication control

Ways of having multiple DID's co-author nodes, and inviting someone to edit your nodes with you. This could be considered more bound to the DID provider than the protocol, but Sidetree implementations are sensitive to [late publishing attacks](https://identity.foundation/sidetree/spec/#late-publishing). Normally this doesn't pose much of a threat since only the document owner can attack itself, but if multiple actors control the document, they need to have a large degree of trust between them.

Potentially, this is resolvable by an account abstraction contract which emits events for the operations, which can be picked up by network nodes and applied automatically and hence limiting the window of attack.

## Retroactive public goods funding

Standardized way to reward contributions to the scientific record, creating a new way to incentivize people to “do the right thing”.

## Research object service economy

Using the fact that our DIDs rely on cryptographic wallets, the protocol should enable a thriving marketplace for research object services. These could be based around writing, validation, reproducibility, data conversion, or even physical services like lab analysis.
