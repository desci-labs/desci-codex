import KeyDIDResolver from "key-did-resolver";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { fromString } from "uint8arrays/from-string";
import { ComposeClient, type ComposeClientParams } from "@composedb/client";
import {
  CeramicClient,
  type CeramicClientConfig,
} from "@ceramicnetwork/http-client";
import { definition } from "@desci-labs/desci-codex-composedb/src/__generated__/definition.js";
import { DID } from "dids";

const DEFAULT_LOCAL_CERAMIC = "http://localhost:7007";

export const authenticatedCeramicClient = async (
  pkey: string,
  endpoint?: string,
  config?: CeramicClientConfig,
) => {
  const client = newCeramicClient(endpoint, config);
  const did = await didFromPkey(pkey);
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

/**
 * Returns a new, unauthenticated compose client. Call `client.setDid()` to
 * authenticate the instance.
 */
export const newComposeClient = (params: Partial<ComposeClientParams>) => {
  if (!params.ceramic) {
    console.log(
      "[codex] ceramic client not provided; defaulting to",
      DEFAULT_LOCAL_CERAMIC,
    );
  }

  return new ComposeClient({
    ceramic: DEFAULT_LOCAL_CERAMIC,
    definition,
    // Let passed config overwrite ceramic, if present
    ...params,
  });
};

export const didFromPkey = async (seed: string) => {
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

/** Get the resources necessary for authorizing a CACAO */
export const getResources = () => newComposeClient({}).resources;

export type { ComposeClient, CeramicClient };
