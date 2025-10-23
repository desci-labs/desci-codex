# 🛠️ Reference implementation

The reference implementation includes models representing the graph entities and relations, a test suite for ensuring functionality, and a GraphiQL service for exploring the relational schemas.

The code is available here: [https://github.com/desci-labs/desci-codex](https://github.com/desci-labs/desci-codex)

There is no graphical demonstration at the time being, but DeSci Labs is testing the protocol in the DeSci [Nodes](https://beta.dpid.org/78) application.&#x20;

## Relational diagram

This is an unhelpfully tangled, but accurate, depiction of the queryable relations between the different entities as expressed in the ComposeDB models, and queryable through the GraphQL API. In the repository, you can play around with these in the GraphiQL interface instead, and query some example data.

<figure><img src="../.gitbook/assets/image (28).png" alt=""><figcaption><p>Click to zoom <span data-gb-custom-inline data-tag="emoji" data-code="1f440">👀</span></p></figcaption></figure>

{% hint style="warning" %}
While this is called a reference implementation, running parallel implementations on different data networks, and syncing the state, is likely impossible. This is not necessary for protocol extensibility, as this is already made possible through ComposeDB.\
\
In the case that the underlying data layer proves to be insufficient for the needs of the protocol, it can be implemented on a different stack and all signed data could be migrated.
{% endhint %}
