---
description: A reusable badge to be earned
---

# 🏅 Claim

Claims are stand-alone attributes, like a diploma without the recipient's name filled in, or a unique rubber stamp. They can be thought of as badges, where the value is dependent on who issued it. These badges are a way to incentivize and validate contributions to the scientific record, and allow building of credibility by recognition in the community.

They are connected to the creator DID, which decides the rules of validation depending on the type of claim.

<figure><img src="../../.gitbook/assets/image (10).png" alt=""><figcaption><p>A stand-alone claim with an associated badge for visualization</p></figcaption></figure>

{% hint style="info" %}
The assignment of a claim is called an [attestation.md](attestation.md "mention"), which we will cover in the next chapter. A claim on its own is quite abstract, but the next chapter will likely clear things up.
{% endhint %}

## Schema

<table><thead><tr><th width="171.33333333333331">Field</th><th width="118">Type</th><th>Description</th></tr></thead><tbody><tr><td><code>title</code></td><td><code>String</code></td><td>Title of the claim, e.g. "Reproducible" or "Published in X"</td></tr><tr><td><code>description</code></td><td><code>String</code></td><td>Description of the attribute it represents and on what grounds it should be granted</td></tr><tr><td><code>badgeIcon</code></td><td><code>CID</code></td><td>Visual representation of the claim</td></tr><tr><td><code>protected</code></td><td><code>Boolean</code></td><td>Valid only if granted by claim creator</td></tr><tr><td><code>reciprocal</code></td><td><code>Boolean</code></td><td>Valid only if accepted</td></tr></tbody></table>

### Badge icon

An image representation of the claim, which should be in square aspect ratio and on a transparent background. Preferably in SVG format, otherwise PNG in 300×300 pixels.

### Protected & reciprocal status

The attestation of a _protected_ claim is only valid if created by the same actor who created the claim. In other words, all grants of the claim done by any other actor are invalid.

The attestation of a _reciprocal_ claim is not valid until it has been accepted by the owner of the recipient entity. It can be considered pending until then.

All combinations of these two values are distinctly expressive, as shown below. Do note that these examples are merely illustrative, and could likely be represented in other ways as well.

<table data-full-width="false"><thead><tr><th width="134.33333333333331" align="center">Protected</th><th width="121" align="center">Reciprocal</th><th>Motivating example</th></tr></thead><tbody><tr><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td><td>A claim like <code>Research funded by NASA</code> should be both <strong>protected</strong> and <strong>reciprocal</strong>.<br><br><strong>Protected</strong> because no-one other than NASA should be able to issue it validly.<br><strong>Reciprocal</strong>, so the author can consent.</td></tr><tr><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td><td>A claim like <code>Published by Science</code> should only be <strong>protected.</strong> <br><br><strong>Protected</strong> because only Science (the journal) can decide what they publish.<br><strong>Non-reciprocal</strong>, because a real-world side effect has taken place either way; the recipient revoking their consent does not make it unpublished.</td></tr><tr><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="2705">✅</span></td><td>A claim like <code>Publicly funded research</code> should just be <strong>reciprocal</strong>.<br><br><strong>Non-protected</strong> because there is no central authority that controls it.<br><strong>Reciprocal,</strong> so the author can consent. </td></tr><tr><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td><td align="center"><span data-gb-custom-inline data-tag="emoji" data-code="274c">❌</span></td><td>A <code>Good Quality</code> community badge should be neither.<br><br><strong>Non-protected</strong> because it's meant to be granted by anyone.<br><strong>Non-reciprocal</strong> because there are no negative effects of its reception.</td></tr></tbody></table>

The next chapter includes visual demonstrations of how validation of attestation on the different types of claims is done in practice.
