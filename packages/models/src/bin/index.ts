#!/usr/bin/env node

import { deploy } from "./deploy.js";
import { register } from "./register.js";

const commands = {
  deploy,
  register,
} as const;

const command = process.argv[2];

if (!command || !(command in commands)) {
  console.log("Usage: desci-codex-models <command>");
  console.log("Requires setting CERAMIC_ONE_RPC_URL=http://... in environment");
  console.log("\nAvailable commands:");
  console.log("  register    Register model interests to Ceramic");
  console.log(
    "  deploy      Deploy models to Ceramic (additionally requires PRIVATE_KEY in environment)",
  );
  process.exit(1);
}

commands[command as keyof typeof commands]();
