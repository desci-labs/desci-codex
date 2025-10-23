---
description: User identification and relations
---

# 🧑‍🔬 Profiles

Before looking at the profile, which is a protocol entity representing a user's public information, it's important to clarify the difference between this and the user's DID.

## What is a DID?

A DID, or Decentralized Identifier, is a new type of identifier that is created, owned, and controlled by the subject of the digital identity, without the need for centralized authorities or intermediaries. DIDs are stored on distributed ledgers or other decentralized networks, ensuring their security and verifiability while giving individuals greater control over their digital identities. A DID is portable in the sense that it can be used in different places; it is not tied to a particular service like the traditional user account.

DIDs come in different shapes and forms, known as providers. A DID provider is a scheme for validating and updating a DID, a common implementation of which is variants on Sidetree as discussed in [introduction-to-sidetree.md](../introduction-to-sidetree.md "mention"). Different providers may have different capabilities, like allowing the user to use multiple keys, control the identifier just using a blockchain account, perform key recovery and rotation, and similar functionality.&#x20;

For the context of the protocol specification, we can think of it simply as an actor-controlled cryptographic key, because that is the basic property that's required to validate user control over entity authorship. Visually, a DID looks something like this:

```
did:pkh:0xb9c5714089478a327f09197987f16f9e5d936e8a
```

## Profile

Since DIDs doesn't always follow a certain structure, we can't generally enter protocol specific information. Even if we could do so, creating references between other protocol entities and the profile is the main benefit of having a dedicated representation of user data in the protocol.&#x20;

The profile entity fulfills this need for linking user-specific information with a DID. As with all other entities, it is under the exclusive control of the creator DID and cannot be updated by anyone else. Perhaps the most valuable information, at least initially, is other social handles of the user.

<figure><img src="../../.gitbook/assets/image (9).png" alt=""><figcaption><p>A profile entity instance listing the author's real name and relevant social handles</p></figcaption></figure>

## Schema

<table><thead><tr><th width="182.33333333333331">Field</th><th width="99">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>displayName</code></td><td><code>String</code></td><td>Human-friendly name of the DID owner</td></tr><tr><td><code>publicKey</code></td><td><code>String</code></td><td>Public key of the DID owner</td></tr><tr><td><code>orcid</code></td><td><code>String</code></td><td>ORCiD handle</td></tr><tr><td><code>googleScholar</code></td><td><code>String</code></td><td>Google Scholar handle</td></tr></tbody></table>

{% hint style="info" %}
This selection of fields is just for demonstration purposes, likely handles need to be associated as a generic key-value JSON map to be forwards-compatible.
{% endhint %}

## Identity verification

The public key field can be used to validate the identity behind the DID and prove its association with the social handles. This mechanism is not part of the protocol per se, but is a useful enough operation that it's worth elaborating on.

For a user to enable verification of association for a social handle listed in their profile, they cryptographically sign a message stating this with the private key corresponding to the public key in their profile. This message is then made available by the user on the platform in question.

### Practical example&#x20;

{% hint style="info" %}
In this example we use the well-known application [`gpg`](https://www.gnupg.org/), but it can be done in various ways.&#x20;

Additionally, this process is not expected to be done by end users but performed as a protocol service. More details on this later, in [identity-verifiers.md](../../protocol-operation/participation/identity-verifiers.md "mention").
{% endhint %}

A user enables verifying control of a social handle by using the private key corresponding to the public key in their profile to sign a message containing their DID fingerprint:

```sh
> gpg -v -o- --clearsign <(echo "did:pkh:0xb9c5714089478a327f09197987f16f9e5d936e8a")
-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256

did:pkh:0xb9c5714089478a327f09197987f16f9e5d936e8a
gpg: RSA/SHA256 signature from: "9860CD32C3A74989 Firstname Lastname me@domain.com>"
-----BEGIN PGP SIGNATURE-----

iQGzBAEBCAAdFiEEJD2AvUlpXneBH9qPmGDNMsOnSYkFAmU3xbYACgkQmGDNMsOn
SYntMwv/ccA3ktC+VFxfm3gC5fKoj6GovXM7v/QMJr9zi3olKDUQ7uJtxxP3y2Eb
sdbWb9SUPJoDbdSCAI8xJXBRKljNdHFCus1VaJMUpL0eMIa2PfukVKBL6EbZxl2M
9iTmHovA1+Wxxqk+S5IGRVA/hFAYyblbwAyGFTeIYbbuMejFYymjSii44khKDMSb
mWJTlbTg5Ck8nWW4JGi/kgtq3UfhxagHFO8SCZ10K3/FApcb6r7iDsvkbvIPDXSS
dKpdMI9drn+I484KHxsJ+gx8CTj5ZbMo94HVaUwx1yeVyqymP6CR9m4wyV9+e8Oz
C4eXsIfxdxvTqmD5qblUqmYpy8XcXgQcmq0F7751pCsrznYFQD++xM1ZHvwwqIj7
5E/9RgbE8Ox9IoJS6PBZlqgVbQ2stE5j6fUqqwHbw99oBjzkw6s2hoIJ5Q4eXZqb
GYfnN+76m2f0ui/jIhUMZAT0G9Nie4xnWUxt7XfDe7cdYULZP2n6C9GnFRY3MEk0
ibipa7gf
=1+R5
-----END PGP SIGNATURE-----
```

The resulting message is then made available on the relevant platform, for example in the user profile.&#x20;

As a third party that wants to verify the identity of this user, first save the user's public key to a file called `key.asc`, and the signed message as `msg.asc`. Then, decrypt the message:

```bash
> gpg --decrypt --keyring key.asc msg.asc
did:pkh:0xb9c5714089478a327f09197987f16f9e5d936e8a
gpg: Signature made Tue Oct 24 15:24:47 2023 CEST
gpg:                using RSA key 243D80BD49695E77811FDA8F9860CD32C3A74989
gpg: Good signature from "Firstname Lastname <me@domain.com>" [trust level]
```

With this decryption successful, validating the signature was indeed made by the same key, we only need to check that the attached DID fingerprint matches the one actually controlling the profile. The reason for this is that otherwise, a fraudulent user could list the same public key in their profile and copy the encrypted message to _their_ social account. With this DID fingerprint payload, we instantly know this is incorrect.
