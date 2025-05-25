#!/usr/bin/env node

import { deployModels } from "../deployment.js";
import { didFromPkey } from "../util.js";

export const deploy = async () => {
  const CERAMIC_ONE_RPC_URL = process.env.CERAMIC_ONE_RPC_URL;
  if (!CERAMIC_ONE_RPC_URL) {
    throw new Error("CERAMIC_ONE_RPC_URL is undefined");
  }

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is undefined");
  }

  const did = await didFromPkey(PRIVATE_KEY);
  await deployModels(CERAMIC_ONE_RPC_URL, did);
};
