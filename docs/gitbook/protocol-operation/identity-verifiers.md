---
description: Open participation, verifiable identity
---

# 🛂 Identity verifiers

Pseudonymous systems have their benefits, but also their drawbacks. An attestation from a credible institution mean a great deal more than the same from an unknown actor. Users want to be certain they enter the correct user as their co-author in a contributor relation, and that the user with a particular social handle in their profile really is that person.

The attestation mechanism allows a decentralized way of providing identity verification in the protocol, where identity verification providers check signatures and issue attestations about their correctness. This would not be a trusted authority, because a gateway or actor can choose which identity verification providers they believe are trustworthy and only use their attestations to discern authenticity.

If an identity verifier is proven to play dirty, it's as simple as disregarding any identity attestations made by that actor and pick another one, with a clean track record indicating credibility.

{% hint style="info" %}
As an alternative, a worthwhile community contribution would be to develop simple end-user tools or gateways for verifying identity without the complexities of `gpg` and similar applications.
{% endhint %}
