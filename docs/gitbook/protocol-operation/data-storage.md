---
description: Ensure longevity of protocol data
---

# 📦 Data storage

Maintenance of the protocol itself relies on the community nodes pinning and indexing the protocol data, which include publication metadata and versioning history. The data entities in the protocol are designed to minimize the storage complexity of this participation. It is important to point out this does not include the data DAG, or file structure, associated with the publication, because it is orders of magnitude larger than the metadata and cannot be naively included simply from cost of storage.

One of the core strenghts of Codex is that it has separated the problems of metadata and discoverability from storage and delivery of the much larger files included in a publication. That makes it possible for multiple solutions for data hosting to co-exist, while still being resolvable through Codex and the [dPID](https://dpid.org) persistent identifier system.

Platforms like [DeSci Nodes](https://nodes.desci.com) provide a generous free tier for pinning publication data to IPFS, but it is also possible for end users or organisations to self-host that data. From the distributed nature of IPFS, and content based addressing, it does not matter where the data happens to be physically hosted for Codex resolution to work.

## Self-hosting publication data

Codex natively supports resolving references to IPFS data by CID. This means it's not required to upload files to the platform where the publication is made, but instead the metadata can define a directory or file as an "external CID". This will then be resolved over the IPFS network.

If you publish using [DeSci Nodes](https://nodes.desci.com), the interface natively support adding a component to the publication as an external CID. This is the right choice for including data that you don't want, or need, DeSci Labs to host for you.

{% hint style="info" %}
If you or your organisation want to self-host data on IPFS, the Kubo client is the most stable and mature. You can refer to the [IPFS documentation](https://docs.ipfs.tech/how-to/) for instructions how to configure Kubo.

The IPFS Desktop application might be suitable for a personal machine, but as data is only available when the node is online it's not a good way to ensure data availability when others try to resolve the content of a publication. What you are looking for is likely to configure a highly available server that runs Kubo. Instructions for that can be found [here](https://docs.ipfs.tech/how-to/command-line-quick-start/), and if you need help you can always reach out in the [community Discord](https://discord.gg/A5P9fgB5Cf).
{% endhint %}

## Community DAG replication

There is ongoing work in expanding the functionality of the Codex Node to allow for community-backed storage of publication data. The vision is that the Codex network can act as a collaborative pinning network, where participants can choose to "donate" a certain amount of disk space which will be used to pin data from publications. This would reduce the reliance on centralised hosting providers, at least for smaller datasets.

## Storage deduplication

There are more advantages in using content addressed storage than location independence, it's also quite efficient in deduplicating stored data. If two research objects use the same large file, a pinning provider only needs to store it once, because if it has the same hash, it _is_ the same data. This optimization happens automatically when pinning data with IPFS.

<figure><img src="../../.gitbook/assets/image.png" alt=""><figcaption><p>Research object data DAG being pinned in multiple locations, with the same address</p></figcaption></figure>

## Data longevity

This begs the question: how can the protocol facilitate long-term safekeeping without a formal guarantee of data availability? The answer is diversity in active storage providers, and being able to choose level of persistence guarantees by potentially combining several of them. Not being reliant on a single organization for storage is great for long term survivability, and from content addressed storage we can have deterministic resolution even if the data location changes.

An point worth iterating is that the protocol is open by design to different solutions to this data storage problem, and tries to separate that from the maintenance of the contextual data. This is a good thing for end-users because there can be continuous development in this area, with a competitive economy around data services. Some could provide hot storage for frequently accessed resources, others very competitive archival storage rates by interfacing with storage protocols like [Filecoin](https://filecoin.io/) or [Arweave](https://www.arweave.org/). Both of these services are very hard to get right for smaller institutions that aren't mainly in the business of running compute and storage infrastructure.

## Compute-over-data capabilities

A publication with results based on large datasets are naturally difficult to reproduce because of the challenges in moving large amounts of data. Content addressed storage opens up for distributed compute over data technologies like [Bacalhau](https://www.bacalhau.org/). In this case, a storage provider could also run Bacalhau nodes, allowing users to send compute jobs to reproduce results to execute on the same site where the data is stored, on capable machines. This efficiently avoids costs associated with data egress and maintaining their own compute infrastructure.
