---
description: When the sand of time is gravel sized
---

# ⌛ Timestamps

Contributions to the data graph do not have an exact time associated, as they are only periodically anchored on a blockchain. This is the only notion of wall-clock time that is available in Sidetree protocols. The time between Ceramic anchor events is still measured in tens of hours, which makes it a bit hard to decide between order of events when rendering a gateway.&#x20;

This is a temporary problem, as the anchoring interval is intended to increase in frequency. The naive solution of adding a date time field to models isn't sufficient, as this would only be possible to validate as somewhere between the previous and next anchor event regardless.

The Ceramic Anchor Service, or CAS, is a centralized system at the time of writing. There is a clear intention to decentralize this over time, which is an important change because it enables gateway operators to anchor private commits to provide verifiable history for unpublished content. Some valuable applications of this are annotation-driven anonymous review, historically verifiable draft-mode in publishing gateways, and similar features.
