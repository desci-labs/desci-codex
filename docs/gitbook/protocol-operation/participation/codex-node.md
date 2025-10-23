---
description: Run your own node to help support the network
---

# 🌐 Codex Node

## What is a Codex Node?

A Codex Node is your contribution to preserving humanity's scientific knowledge. By running a node, you become part of a distributed network that ensures research publications, data, and code remain accessible forever. With this resilience, Codex can continue to serve content regardless of what happens to any individual institution or service.

## How Does It Work?

Your Codex Node consists of two complementary services:

### 1. **Codex service** 
Stores and serves the publication metadata and (optionally) publication artifacts like manuscripts, datasets, code, figures, etc. This information is fetched from other peers over IPFS, after which your node makes it available to other peers in the network. So when researchers publish their work, it gets distributed across nodes worldwide, including yours!

### 2. **Ceramic service**
Participates in peer-to-peer network gossip to discover and verify new publications, as well as updates to existing publications. This automatic content discovery is what feeds the Codex service information about what new content it needs to find and help distribute. The ceramic node is also responsible for validating cryptographic signatures from the author, and tracking the versioning of each publication.

These services run as containers, and together they ensure that both content and context are preserved permanently.

## Why Run a Node?

By running a Codex Node, you:

- **Preserve Science**: Help ensure critical research remains accessible to future generations
- **Support Open Access**: Enable researchers worldwide to access scientific knowledge without barriers
- **Increase Network Resilience**: Every additional node makes the network stronger and more resistant to failure
- **Contribute to Decentralization**: Reduce dependency on single institutions or companies for preserving knowledge

## Requirements

Running a Codex Node is straightforward and requires:

- **Disk Space**: At least 100GB available (more is better )
- **Internet**: Stable connection with reasonable bandwidth for syncing content
- **Docker**: The node runs as containerized services for easy deployment
  - Of course, it is also possible to run a Codex Node in a cloud setting as either a VM or in Kubernetes, or as regular system services on your machine.
- **System**: Works on Linux, macOS, or Windows with WSL2

## Getting Started

Setting up a Codex Node involves running two Docker containers that work together to preserve and serve scientific content. 

For detailed setup instructions, see the Codex Node documentation in the [DeSci Codex](https://github.com/desci-labs/desci-codex) repository.

### What Happens Next?

Once running, your node will:
- Automatically discover and sync existing publications
- Vigilantly listen to network gossip and sync future publications
- Redistribute content over IPFS
- Participate in the network's consensus mechanisms
- Help verify the integrity of stored data

## Join the Community

Running a node makes you part of a global community working to democratize access to scientific knowledge. Connect with other node operators in the [Discord Community](https://discord.gg/A5P9fgB5Cf), this is the place to get help and share experiences

---

Every node matters. By running a Codex Node, you're not just storing data. You are contributing to the safekeeping of a decentralised scientific record for a long time to come.
