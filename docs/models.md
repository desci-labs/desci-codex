# GraphQL Models
In this document, we'll explore the GraphQL models for ComposeDB, their relationships, and the design rationale behind them.

## Overview
> Abbreviations are explained in the [glossary](##glossary)

> Relevant properties of ComposeDB is explained [here](composedb.md)

## Design Summary
The design of these models is centered around the concept of decentralized identity and attestations. The models are structured to support the creation, management, and verification of claims and attestations in a decentralized system.

The use of StreamID and CommitID allows for versioning and tracking changes over time, ensuring data integrity and traceability. The use of directives like `@createModel`, `@createIndex`, and relation directives ensures efficient data retrieval and establishes clear relationships between models.

In conclusion, these GraphQL models provide a robust framework for managing research objects, organizations, claims, and attestations in a decentralized environment. The design ensures data integrity, traceability, and efficient data retrieval.

## A word on relations
Relations are a type of view, meaning it's not part of the data in a model but additional context in the form of traversible links to other nodes. In other words, they establish connections between models that allow for complex data selection.

These relationships between the models are defined using directives such as `@relationDocument`, `@relationFrom`, and `@relationCountFrom`. More information about directives can be found in the [ComposeDB primer](composedb.md). 

For example, the `Attestation` model has a `claimID` field that points to a specific `Claim`. This relationship is further solidified by the `@relationDocument` directive, which directly relates the `Attestation` to the `Claim` model.

## Model Descriptions
### ResearchObject
The research object is the main container for the publication data. The model does not contain all the information, but is a way of contextualizing the actual manifest file which is stored on IPFS and referenced through CID.

- **owner**: The owner of the research object, represented by DID.
- **version**: The version of the research object, represented by CommitID.
- **title**: The title of the research object.
- **manifest**: A CID that points to the manifest of the research object.

### Organization
An abstract representation of an organization.

- **owner**: The owner of the organization, represented by DID.
- **name**: The name of the organization.
- **members**: A list of members of the organization, each represented by DID.

### Claim
A claim is a reusable statement, which is used as context for an attestation.

- **maintainer**: The maintainer of the claim, represented by DID.
- **version**: The version of the claim, represented by CommitID.
- **title**: The title of the claim.
- **description**: A description of the claim.
- **badge**: A CID that points to the visual representation of the claim.

### Attestation
An attestation is the public announcement that the `source` DID thinks that the node at `targetID` fulfills the properties of a `claim`. If the attester no longer agrees, they can update the node with `revoked` set to true.

- **source**: The source of the attestation, represented by DID.
- **version**: The version of the attestation, represented by CommitID.
- **targetID**: A StreamID that points to the target of the attestation.
- **claimID**: A StreamID that points to the claim associated with the attestation.
- **claim**: A direct relation to the Claim model.
- **revoked**: A boolean indicating whether the attestation has been revoked.

#### Quirks
`targetID` is generic for the attestation, i.e. can point to any type of stream. At the moment, this means that it's not possible to create a traversible relation 

### Profile

- **owner**: The creator of the profile, represented by DID.
- **recievedAttestations**: A list of attestations received by the profile.
- **givenAttestations**: A list of attestations given by the profile.



## Glossary
### DID
Decentralised Identifier, a type of cryptographic identity verifiable in a decentralised fashion. We use the `did:phk` provider, which can be generated from any blockchain account.

### CID
Content Identifier, a self-describing cryptographic hash which acts as an immutable link to content. While it is used under the hood for almost everything in ComposeDB/Ceramic, we use it explicitly for linking content that is too large or otherwise unsuitable to put in the ComposeDB models. The data manifest is a good example of this.
