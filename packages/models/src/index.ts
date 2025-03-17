import "dotenv/config";
import { getCeramicClient } from "@ceramic-sdk/http-client";
import { errWithCause } from "pino-std-serializers";
import { MODELS } from "./models.js";

const CERAMIC_ONE_RPC_URL = process.env.CERAMIC_ONE_RPC_URL;
if (!CERAMIC_ONE_RPC_URL) {
  throw new Error("CERAMIC_ONE_RPC_URL is undefined");
}

const client = getCeramicClient(CERAMIC_ONE_RPC_URL);

// await client.getEvent('bagcqcerasj2pzoblzrnb64xhsflcdjnoqfb3prncjb4auuoheertty4fzkea')

for await (const model of MODELS) {
  try {
    await client.registerInterestModel(model);
  } catch (e) {
    console.error(errWithCause(e as Error));
  }
}
