import "dotenv/config";
import { fileURLToPath } from "url";
import { MODEL_IDS } from "./models.js";
import { registerModelInterests } from "./interests.js";

// Only run if this is the main module (directly executed)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const CERAMIC_ONE_RPC_URL = process.env.CERAMIC_ONE_RPC_URL;
  if (!CERAMIC_ONE_RPC_URL) {
    throw new Error("CERAMIC_ONE_RPC_URL is undefined");
  }
  await registerModelInterests(CERAMIC_ONE_RPC_URL);
}

export { MODEL_IDS, registerModelInterests };
