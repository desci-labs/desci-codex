---
description: Legacy ID translation
---

# 🏷️ Legacy PID mapping

{% hint style="info" %}
This is just one example use case of actors maintaining mappings to other systems through the extensible nature of the protocol, one can imagine the same concept applying to other areas as well.
{% endhint %}

There are a couple of PID systems in use today, where [DOI](https://www.doi.org/) is the current de facto provider for persistent identifiers in the scientific community. However, being a centralized service, and additionally dependent on location-based URL's, there can be no guarantees against content drift or link rot. Particularly not so over a very long timescale.

That does not mean that DOI is incompatible with the truly persistent identifiers of the protocol, rather the opposite. Instead of pointing a DOI to a GitHub repository or a journal hosting your paper, it can be pointed to an identifier on the protocol and achieve true persistence and stability.

In some cases, an update of the DOI is not possible, because it's issued by an institution or there is an unwillingness to disconnect fully from the current hosting. Solving this is a valuable service to provide in the protocol: create entities and nodes for mapping legacy PID's to protocol nodes.

This also means that the work of a deceased researcher can be ported retroactively, and the DOI bound to the work can be manually mapped to the new node. After this, the community can enrich the context and metadata for the research, since the publication will be persistently addressable and made available for as long as the protocol exists. The correctness of these mappings will be built on social trust, the same way as explained in [identity-verifiers.md](identity-verifiers.md "mention").
