import { getCeramicClient } from "@ceramic-sdk/http-client";
import { MODEL_IDS } from "./models.js";
import { errWithCause } from "pino-std-serializers";

export async function registerModelInterests(ceramicOneRpcUrl: string) {
  const client = getCeramicClient(ceramicOneRpcUrl);

  for await (const [modelName, modelId] of Object.entries(MODEL_IDS)) {
    try {
      console.log(
        `Registering interest in model ${modelName} with ID ${modelId}`,
      );
      await client.registerInterestModel(modelId);
    } catch (e) {
      console.error("Failed to register interest in model", {
        modelName,
        modelId,
        error: errWithCause(e as Error),
      });
      throw e;
    }
  }
}
