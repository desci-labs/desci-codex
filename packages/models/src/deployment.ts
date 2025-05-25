import { ModelClient } from "@ceramic-sdk/model-client";
import { DID } from "dids";
import { MODEL_SCHEMAS } from "./models.js";

export const deployModels = async (ceramicOneRpcUrl: string, did: DID) => {
  const modelClient = new ModelClient({
    ceramic: ceramicOneRpcUrl,
    did,
  });

  for (const [name, schema] of Object.entries(MODEL_SCHEMAS)) {
    const modelId = await modelClient.createDefinition(schema, did);
    console.log(`Deployed model ${name} as ${modelId}`);
  }
};
