---
description: The grant or assignment process for a badge
---

# 📯 Attestation

An attestation expresses the opinion that a certain target fulfills a given claim. To expand on the analogies from the previous section, an attestation corresponds to filling in the name in the diploma, or using the rubber stamp on a document. The value of an attestation depends on both the claim and the issuer, but could represent a wide selection of properties:

* Curation by a prestigious journal
* Passed a FAIR data review
* Result reproducibility verified
* Metadata fulfilling a standard
* Data and code available

These attestations build credibility for actors in the system, not only for publishing original research but for any number of other contributions to the maintenance of the scientific record. This is a way to get verifiable certifications for contributions, which can be used in the real world for securing research funding, qualifying for programs, or securing positions based on verifiable merit.

Many publishers and funding agencies are starting to push hard requirements for data availability and open science practices, and the attestation system in the protocol can express the certifications to prove it.

<figure><img src="../../.gitbook/assets/image (13).png" alt=""><figcaption><p>The abstract representation of an attestation being granted to a research object, awarding it a badge of reproducibility.</p></figcaption></figure>

## Schema

<table><thead><tr><th width="185.33333333333331">Field</th><th width="137">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>targetID</code></td><td><code>ID</code></td><td>Unique ID of the target entity</td></tr><tr><td><code>targetVersion</code></td><td><code>Commit</code></td><td>Specific version of the target</td></tr><tr><td><code>claimID</code></td><td><code>ID</code></td><td>Unique ID of the attestation claim</td></tr><tr><td><code>claimVersion</code></td><td><code>Commit</code></td><td>Specific version of the claim</td></tr><tr><td><code>revoked</code></td><td><code>Boolean</code></td><td>Whether or not the attestation has been revoked</td></tr></tbody></table>

### Target

The attestation can target any protocol entity, including attestations themselves. This is a very flexible primitive which aims to unlock a variety of use-cases by the community that cannot be foreseen in advance.

### Revocation

If the attester changes their opinion on the target's fulfillment of the claim requirements, the attestation can be updated to revoke. The update history of the attestation will still show when it was initially assigned, and from which target version it should be considered revoked. Ideally, an  [annotation.md](annotation.md "mention") is made to motivate the revocation. The attestation should be considered valid for the target versions in between granting and revoking.

## Separation from claims

A common question is why there is a distinction made between attestations and claims. Making the claim a separate entity means that an instance made by a credible organization has a unique identifier together with verifiable provenance binding it to that organization. This identifier can be used to find all attestations made with this claim, and the identity of the claim maintainer to validate the attestations made.

The alternative would be that each attestation is unique, and the creator could freely choose a badge icon, title, and description, making it a much harder search problem to figure out authenticity and provenance. An attestation with a dedicated claim is easily verified by looking at the DID's that signed the different entities.

## Validation rules

The boolean values `protected` and `reciprocal` on a claim as explained in the previous chapter are difficult to illustrate without the attestation validation rules. Here are a set of diagrams illustrating which attestation pattern and hence validation rules are required for each combination of these properties to be considered valid.

<figure><img src="../../.gitbook/assets/image (18).png" alt=""><figcaption><p>Valid attestation pattern for a claim that is <strong>non-protected</strong> and <strong>non-reciprocal,</strong> essentially without constraints.<br>The claim and the attestation can be made by different actors, and the creator of the target does not need to consent.</p></figcaption></figure>

<figure><img src="../../.gitbook/assets/image (15).png" alt=""><figcaption><p>Valid attestation pattern for a claim that is <strong>protected</strong> and <strong>non-reciprocal</strong>.<br>This differs to the previous diagram in that the creator of the claim and the attestation must be the same actor.</p></figcaption></figure>

<figure><img src="../../.gitbook/assets/image (3).png" alt=""><figcaption></figcaption></figure>

<figure><img src="../../.gitbook/assets/image (14).png" alt=""><figcaption><p>Valid attestation pattern for a claim that is both <strong>protected</strong> and <strong>reciprocal</strong>. Note that the attester is the creator of the claim, and in addition, the creator of the target has mirrored the attestation.</p></figcaption></figure>

### Requests, issuance, and confirmation

For protected claims, an actor should be able to request it to their own work. If we use the mirroring attestation as explained in the diagrams above, depending on the order of creation this can be thought of in two ways.

The first, **issue & accept**, starts with an attestation from the creator of a protected claim. If the owner of the target entity consents, they create the corresponding attestation back, closing the circle.

In the second case, **request & grant**, the author of a piece of research does an (invalid) attestation of a protected claim to an entity they own. The creator of the claim can get notified, review the request, and if everything checks out they attest the other direction and close the circle.

The end result in both scenarios is the same, but there are two ways of getting there, depending on which party initiates the process.

### Alternative consent pattern

Instead of mirroring the attestation, one could also imagine a dedicated claim indicating consent which can be used to accept an attestation. The main issue this would solve is that the mirrored attestations are on their own invalid in case the claim is protected, which is a sort of exception to the rules that may be trickier to implement.

The drawback of this is that it blocks the mechanism of requesting attestations of protected claims as described in the previous section, so some other process would be necessary to capture that flow.

<figure><img src="../../.gitbook/assets/image (20).png" alt=""><figcaption><p>Alternative way to represent attestation consent, using a dedicated type of claim instead of attestation mirroring.</p></figcaption></figure>



