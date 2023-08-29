import KeyDIDResolver from "key-did-resolver";
import { randomBytes } from "crypto";
import { toString } from "uint8arrays/to-string";
import { writeFile } from "fs";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { homedir } from "os";
import { cwd } from "process";
export const RunCommands = async () => {
  const generateAdminKeyDid = async () => {
    const seed = new Uint8Array(randomBytes(32));
    const keyResolver = KeyDIDResolver.getResolver();
    const did = new DID({
      provider: new Ed25519Provider(seed),
      resolver: {
        ...keyResolver,
      },
    });
    await did.authenticate();
    return {
      seed: toString(seed, "base16"),
      did,
    };
  };
  const generateLocalConfig = async (adminSeed, adminDid) => {
    const configData = {
      anchor: {},
      "http-api": {
        "cors-allowed-origins": [".*"],
        "admin-dids": [adminDid.id],
      },
      ipfs: {
        mode: "bundled",
      },
      logger: {
        "log-level": 2,
        "log-to-files": true,
        "log-directory": "local-data/ceramic/logs"
      },
      metrics: {
        "metrics-exporter-enabled": false,
        "metrics-port": 9090,
      },
      network: {
        name: "inmemory",
      },
      node: {},
      "state-store": {
        mode: "fs",
        "local-directory": "local-data/ceramic/statestore",
      },
      indexing: {
        db: `sqlite://${process.cwd()}/local-data/ceramic/indexing.sqlite`,
        "allow-queries-before-historical-sync": true,
        // Cannot be enabled on inmemory, but activate for proper networks
        // "enable-historical-sync": "true"
        models: [],
      },
    };
    writeFile(
      `${process.cwd()}/composedb.config.json`,
      JSON.stringify(configData),
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );
    writeFile(`${process.cwd()}/admin_seed.txt`, adminSeed, (err) => {
      if (err) {
        console.error(err);
      }
    });
  };
  const { seed, did } = await generateAdminKeyDid();
  console.log(seed, did);
  await generateLocalConfig(seed, did);
};
RunCommands();
