# Ceramic-one

Tidbits on interacting with the `ceramic-one` service.

## Sync up a local node
Start the local node:
```bash
❯ docker compose -f docker/compose.yaml -f docker/compose.dev.yaml up ceramic
```

Register model interests (only first start):
```bash
❯ cd packages/models
❯ npm run register

Registering interest in model meta with ID kh4q0ozorrgaq2mezktnrmdwleo1d
Registering interest in model researchObject with ID kjzl6hvfrbw6cbe01it6hlcwopsv4cqrqysho4f1xd7rtqxew9yag3x2wxczhz0
```

Until sync backoff from invalid chains issue is solved, manually peer with remote node:
```bash
❯ curl --fail-with-body -X POST \
    http://localhost:5101/ceramic/peers?addresses=/dns4/k8s-default-ceramicr-28d84f3c2a-fcc7b824aa77bcf6.elb.us-east-2.amazonaws.com/tcp/4101/p2p/12D3KooWPL8CgPzyeuY14Lv6EQhTkdLEEBRAtfzksYhiTE3zeBEo
```


## Manually inspecting index with DBeaver

In Driver Manager, click New and fill in this info:
```yaml
Driver Name: Arrow Flight SQL
URL Template: jdbc:arrow-flight-sql://{host}:{port}?useEncryption=false&disableCertificateVerification=true
```

Hit the Libraries tab, click Add Artifact, and add this dependency:
```xml
<dependency>
    <groupId>org.apache.arrow</groupId>
    <artifactId>flight-sql-jdbc-driver</artifactId>
    <version>18.2.0</version>
</dependency>
```

Now you can save the driver, and create a new connection. Select the driver we just set up, and fill in the connection info:
```yaml
Host: localhost
Port: 5102
```
