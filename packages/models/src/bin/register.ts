#!/usr/bin/env node

import { registerModelInterests } from "../interests.js";

export const register = async () => {
  const CERAMIC_ONE_RPC_URL = process.env.CERAMIC_ONE_RPC_URL;
  if (!CERAMIC_ONE_RPC_URL) {
    throw new Error("CERAMIC_ONE_RPC_URL is undefined");
  }

  await registerModelInterests(CERAMIC_ONE_RPC_URL);
};
