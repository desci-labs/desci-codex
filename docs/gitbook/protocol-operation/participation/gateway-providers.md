---
description: User-facing applications for interaction with the protocol
---

# 🔮 Gateway providers

The protocol itself isn't meant for direct end-user interaction, but to act as the underlying storage and indexing solution that enable them. A gateway is any type of application allowing end users to interact with the underlying protocol.

A gateway can freely choose what data from the protocol to surface. This means that a gateway can decide to skip supporting annotations and attestations and just support a reader experience, or go the other way and be a fully-fledged command center for protocol interaction. The same applies for attestations, does the gateway only show attestations from verified, credible institutions, or any made by unknown community members? Does it show annotations only made by researchers with a verified ORCiD account? There are no right or wrong answers; different use cases may demand different views into the data of the protocol.

{% hint style="info" %}
Access to and participation with the underlying protocol will always remain free and uncensored, gateways can be proprietary or freemium services serving high-volume use cases. This unlocks the creation an economy built around interactions with the scientific record, without leading to data silos, paywalls, or link rot.
{% endhint %}

## Example gateways

Here are some example gateways that would provide valuable ways of interacting with the protocol. It's likely that several use cases are woven together into a homogenous interface, and that some gateways are specialized for large organizations.

### Authoring experience

Provide a way to for a researcher to iteratively build research objects and publish their results. [DeSci Nodes](https://nodes.desci.com/) is such a gateway.

### Data stewardship portal

A way for data stewards to find research objects where the author needs help organizing data or code in a publication, or to define correct metadata for their components.

### Attestation manager

A portal for organizations to manage claims and requests for attestations and, track application processes and schedule follow-ups.

### Organization manager

Allow organizations to keep track of members and their contributions in the protocol, allowing sponsorship of data storage and similar institutional services.

### Reference manager

Make collections of interesting works to use for citations, potential collaboration, data or code re-use, or simply as a reading list.

### Graph visualization

Graphical representations of the protocol graph, allowing unprecedented exploration in the provenance of scientific discovery.

### Peer-review systems

Application for managing peer review flows for journals, authors, and reviewers. This enables a transparent peer-review process, but it could be anchored in an unpublished state for some type of retroactive reveal scheme.

### Funding tracker

A portal where funders can track the ongoing progress of research they have funded, from following the progress to evaluating the resulting impact of the funded publications.

### Metrics portal

Compiling statistics, impact measures, charts, research field growth, or any number of exciting properties of the open data repository.

### Journals

Running a journal is immensely less expensive and complicated when the publications with artifacts are openly available and persistently addressable in the protocol. Providing the services necessary to build and maintain journals is a valuable activity.

### Data pinning trackers

Tracking which parts of the graph or research publications are well pinned in the IPFS [DHT](https://docs.ipfs.tech/concepts/dht/), and where community efforts are needed to ensure future stability.

### Metadata services

Allowing translation of metadata formats to be used when interfacing between different systems. Additionally, it could allow powerful queries over a metadata index, like searching by schema or joining metadata files with their community suggestions.
