import { ComposeClient, ComposeClientParams } from "@composedb/client";
import {
  CeramicClient,
  CeramicClientConfig,
} from "@ceramicnetwork/http-client";
import { definition } from "./__generated__/definition.js";
import { RuntimeCompositeDefinition } from "@composedb/types";

const DEFAULT_LOCAL_CERAMIC = "http://localhost:7007";

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

export const newComposeClient = (params?: ComposeClientParams) => {
  if (!params?.ceramic) {
    console.log(
      "[codex] ceramic client not provided; defaulting to",
      DEFAULT_LOCAL_CERAMIC,
    );
  }

  return new ComposeClient({
    ceramic: DEFAULT_LOCAL_CERAMIC,
    definition: definition as RuntimeCompositeDefinition,
    // Let passed config overwrite, if present
    ...params,
  });
};
