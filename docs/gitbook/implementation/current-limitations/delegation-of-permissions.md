---
description: Allow helping hands
---

# 🎟️ Delegation of permissions

Some planned features depend on the ability to delegate control over certain operations, like allowing someone to publish data on your behalf. For instance, letting members of an organization issue attestations on behalf of the organization DID, inviting a data steward to update the data DAG for a publication, et cetera.

This is a hard problem in the decentralization space as identity circulates around the cryptographic wallet and solutions like multisigs and ring signatures are hard to work with. But there are two main ways forward.

## Gateway operation batching

Gateways could implement advanced features to allow organizations to manage members, and through this collect suggested operations from individuals, which are compiled into a set that can be accepted and published by someone with control over the organization DID.

This pattern of collecting suggestions that are ultimately applied by the controlling DID could be used to solve many problems regarding multi-author collaboration. The gateway can help organize the changes, illustrate the effects of application for the decision maker, and aid in adding relevant contributor relations if necessary.

## Account abstractions

Instead of using a traditional single-user wallet to approve changes to a node, the DID could be controlled by what's called an account abstraction. This is a wallet controlled by a smart contract, which allows more or less arbitrary logic to regulate which keys can perform different types of actions. This could be a way to implement multi-author publishing, delegate control over publishing, and allowing a user DID to “impersonate” an organization.
