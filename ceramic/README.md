# Ceramic-one

Tidbits on interacting with the `ceramic-one` service.

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
