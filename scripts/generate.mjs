import { getResolver } from "key-did-resolver";
import { randomBytes } from "crypto";
import { toString } from "uint8arrays/to-string";
import { fromString } from "uint8arrays/from-string";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";

const PWD = process.cwd();
const CONFIG_PATH = `${PWD}/composedb.config.json`;
const SEED_PATH = `${PWD}/admin_seed.txt`;

export const Generate = async () => {
  const newSeed = () => {
    const raw = new Uint8Array(randomBytes(32));
    return toString(raw, "base16");
  };

  const generateAdminKeyDid = async () => {
    const seed = readFileSync(SEED_PATH);
    const key = fromString(seed, "base16");
    const did = new DID({
      provider: new Ed25519Provider(key),
      resolver: getResolver(),
    });
    await did.authenticate();
    return did;
  };

  const generateLocalConfig = async (adminDid) => {
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
        "log-directory": "local-data/ceramic/logs",
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
        db: `sqlite://${PWD}/local-data/ceramic/indexing.sqlite`,
        "allow-queries-before-historical-sync": true,
        // Cannot be enabled on inmemory, but activate for proper networks
        // "enable-historical-sync": "true"
        models: [],
      },
    };
    writeFileSync(CONFIG_PATH, JSON.stringify(configData, undefined, 2));
  };

  if (!existsSync(SEED_PATH)) {
    console.log("Creating new admin seed...");
    writeFileSync(SEED_PATH, newSeed());

    console.log("Generating new config...");
    const did = await generateAdminKeyDid();
    console.log("Saving new DID:", JSON.stringify(did, undefined, 2));
    await generateLocalConfig(did);
  } else if (!existsSync(CONFIG_PATH)) {
    console.log("Found seed but no config, generating...");
    const did = await generateAdminKeyDid();
    await generateLocalConfig(did);
  } else {
    console.log("Seed and config present, skipping generation.");
  }
};

Generate();
