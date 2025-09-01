# CODEX Node Architecture Design

The CODEX Node system is designed to create a resilient, decentralized mesh of nodes that collaborate to make research content discoverable and retrievable. By distributing copies of metadata and versioning information across multiple nodes, the system achieves higher resilience against failures and ensures continuous availability of critical information.

Node coordination happens in a peer-to-peer fashion without a central point of failure. This means that new nodes can automatically discover and reprovide metadata about published content, creating a self-healing network that aims for maximal alignment with the FAIR (Findable, Accessible, Interoperable, Reusable) data principles.

While the versioning and metadata are always being replicated as required by FAIR standards, the actual datasets can also be replicated by nodes that choose to do so, providing additional resilience for the complete closures of research publications.

## Overview

The CODEX Node is a P2P application designed to enhance network resiliency, improve data availability, and decentralize the storage of CODEX information. It consists of two main components working in tandem:

1. A Ceramic node
2. A CODEX service with IPFS capabilities

## Component Responsibilities

### Ceramic service

On CODEX, each published piece of data is tracked and versioned using Ceramic streams.

The Ceramic service is responsible for:

1. **Validation and event propagation**
   - Continuously listens to peer-to-peer gossip about new events on CODEX streams
   - Validates events and participates in further network propagation
   - Maintains a feed of stream state changes and updates

2. **Stream State Management**
   - Tracks the latest state of all streams implementing CODEX models
   - Maintains historical state information for streams
   - Handles stream resolution at different points in time

### CODEX service

The Ceramic node isn't aware of anything CODEX specific other than the stream model/schema. The CODEX node uses information about the content of the models to replicate any linked IPFS content therein.

The CODEX service is responsible for:

1. **Manifest Management**
   - Subscribes to the ceramic node event feed
   - Extracts CIDs from research object stream events
   - Locally replicates publication manifests

2. **IPFS Integration**
   - Handles content persistence and retrieval
   - Runs an Helia IPFS client instance for finding IPFS data referenced in CODEX streams
   - Contributes to content availability for this data in the IPFS network

3. **Network Participation**
   - Reprovides the data in the IPFS DHT to aid content accessibility
   - Serves content to other nodes in the network

## Data Flow

1. **Event Detection**
   ```
   Ceramic Network
    -[network gossip]-> Ceramic Node
    -[FlightSQL subscription]-> CODEX Node
   ```

2. **Content Replication**
   ```
   Ceramic Node
    -[events]-> CODEX Node
    -[CIDs]-> IPFS client
    -[files]-> IPFS Network
   ```

## Technical Implementation

- Helia-based IPFS capabilities
- Libp2p networking stack
- Content addressing and persistence
- DHT participation for content discovery
- Automatic content reprovisioning

## Network Resilience

The system achieves network resilience through:

1. **Distributed Storage**
   - Multiple nodes storing the same content
   - IPFS content addressing ensuring content integrity
   - DHT-based content discovery

2. **Redundant Event Processing**
   - Multiple nodes processing stream events
   - Event feed redundancy
   - Stream state verification

3. **Content Availability**
   - Automatic content pinning
   - Content reprovisioning
   - DHT-based content routing

## Security Considerations

1. **Content Integrity**
   - Content addressing through CIDs
   - Immutable content storage
   - Version history tracking

2. **Network Security**
   - Libp2p secure transports
   - TLS encryption

## Future Improvements

1. **Network Connectivity**
   - Enhanced libp2p connectivity
     - Make sure nodes are highly communicative in different network conditions
   - Improved content announcement
     - Reliable and efficient reprovide rounds

2. **Monitoring and Statistics**
   - Network health monitoring
   - Content availability metrics
