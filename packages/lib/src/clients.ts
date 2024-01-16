import KeyDIDResolver from "key-did-resolver";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { DID } from "dids";
import { fromString } from "uint8arrays/from-string";
import { ComposeClient, type ComposeClientParams } from "@composedb/client";
import {
  CeramicClient,
  type CeramicClientConfig,
} from "@ceramicnetwork/http-client";
import type { Optional } from "./types.js";

const DEFAULT_LOCAL_CERAMIC = "http://localhost:7007";

export const authenticatedCeramicClient = async (
  didSeed: string,
  endpoint?: string,
  config?: CeramicClientConfig,
) => {
  const client = newCeramicClient(endpoint, config);
  const did = await didFromSeed(didSeed);
  client.setDID(did);
  return client;
};

export const newCeramicClient = (
  endpoint?: string,
  config?: CeramicClientConfig,
) => {
  if (!endpoint) {
    console.log(
      "[codex] ceramic endpoint not provided; defaulting to",
      DEFAULT_LOCAL_CERAMIC,
    );
  }
  return new CeramicClient(endpoint ?? DEFAULT_LOCAL_CERAMIC, config);
};

export const newComposeClient = (
  params: Optional<ComposeClientParams, "ceramic">,
) => {
  if (!params.ceramic) {
    console.log(
      "[codex] ceramic client not provided; defaulting to",
      DEFAULT_LOCAL_CERAMIC,
    );
  }

  return new ComposeClient({
    ceramic: DEFAULT_LOCAL_CERAMIC,
    // Let passed config overwrite ceramic, if present
    ...params,
  });
};

export const didFromSeed = async (seed: string) => {
  const keyResolver = KeyDIDResolver.getResolver();
  const key = fromString(seed, "base16");
  const did = new DID({
    provider: new Ed25519Provider(key),
    resolver: {
      ...keyResolver,
    },
  });
  await did.authenticate();
  return did;
};

export type { ComposeClient, CeramicClient };
