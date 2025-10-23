---
description: Deterministically resolving an entity instance, including particular versions
---

# 🎣 Deterministic resolution

To enable persistent resolution of nodes by address, we need to define an algorithm for deterministically traversing the graph. This definition is described assuming little more than functional Sidetree nodes able to find state at given commits, and the implementation of a resolver will differ depending on the practical applications used.

For resolution, we use both the node `ID` and the version `Commit`. Both are unique persistent identifiers by Sidetree definition, and uniquely resolvable due to how Sidetree deterministically resolves conflicts and cryptographically ensures document update ordering.

{% hint style="info" %}
Some of the resolution steps laid out below linear in size complexity, while they may well be more or less constant time given a properly maintained index.
{% endhint %}

{% hint style="info" %}
This section talks about _protocol-native_ addressing, which something like [dPID](https://www.dpid.org/) can use for resolution. This is not necessarily the same thing, depending on how dPID chooses to structure addressing.
{% endhint %}

## Resolution cases

These cases define one step of addressing, grouped by type of target. However, a link is ideally done directly to a particular version of a node. This means using the unique ID and commit of an attestation to resolve that node, instead of addressing it relative to its target. This way of addressing allows for, more or less, instant lookups where relative addressing can contain multiple resolution steps to resolve.

### Root node

Addressing the latest state of some node `N`:

1. Query network for status of node `N`

### Particular version

Addressing a particular commit `C` of a node `N`:

1. Query network for status of node `N` at commit `C`

### Particular time

Addressing the state of a node `N` as of time `T`:

1. Query network for update history of node `N`
2. Find the newest commit `C` that was anchored before or at time `T`
3. Resolve node `N` at commit `C`

### Particular version index

Addressing a particular version `k` of a node `N`:

1. Query network for update history of node `N`
2. Select commit `C` at index `k` in update history
3. Resolve node `N` at commit `C`

### Outgoing edge

Addressing of an outgoing edge from a node `N` made against some other node:

1. Resolve `N`
2. Get value `R` from reference field
3. Resolve node `R`

### Versioned outgoing edge

Addressing a versioned outgoing edge from a node `N` made against some other node:

1. Query network for status of node `N`
2. Get value of reference field `R` and version field `C`
3. Resolve node `R` at commit `C`

### Incoming edges

Addressing of an incoming edge to node `N`, from some node `N2` of entity type `T`:

1. Query network for all nodes of type `T`
2. Find node `N2` with
   1. Reference field set to `N1`
3. Resolve `N2`

{% hint style="info" %}
An example of this is components or annotations pointing to a research object, and we address it from the perspective of the research object.
{% endhint %}

### Versioned incoming edges

Addressing of an incoming edge to node `N` as of version `C`, from some node `N2` of entity type `T`:

1. Query network for all nodes of type `T`
2. Query network for update history `U` of node `N`
3. Find versions `V` of node `N2` with
   1. Reference field set to `N`
   2. Version field value in `U` before version `C`
4. Resolve `N2`, considering `V` the update history while targeting `N` at `C`

{% hint style="info" %}
An example of this is addressing all attestations made up until a certain point for a particular research object.
{% endhint %}

### Versioned data DAG paths

Addressing a DAG node through UnixFS path `P`, in research object `N` as of version `C`:

1. Resolve `N` at version `C`
2. Get value `DAG` in manifest CID field
3. While `P` not empty
   1. Pop first segment `S` from `P`
   2. Set `DAG' = lookup(S, DAG)`
   3. Loop with `DAG'` as `DAG`
4. `DAG` is now the addressed node or leaf

{% hint style="info" %}
Data DAG path addresses should always specify a particular research object version.
{% endhint %}
