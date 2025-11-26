import Conf from "conf";
import chalk from "chalk";

export type Environment = "local" | "dev" | "staging" | "prod";

export interface CodexConfig {
  apiKey?: string;
  environment: Environment;
  defaultNodeUuid?: string;
}

const schema = {
  apiKey: { type: "string" as const },
  environment: {
    type: "string" as const,
    default: "dev",
    enum: ["local", "dev", "staging", "prod"],
  },
  defaultNodeUuid: { type: "string" as const },
};

export const config = new Conf<CodexConfig>({
  projectName: "desci-codex-cli",
  schema,
});

export const ENV_CONFIGS = {
  local: {
    apiUrl: process.env.NODES_API_URL || "http://localhost:5420",
    ipfsGateway: "http://localhost:8089/ipfs",
    webUrl: "http://localhost:3000",
  },
  dev: {
    apiUrl: "https://nodes-api-dev.desci.com",
    ipfsGateway: "https://ipfs.desci.com/ipfs",
    webUrl: "https://nodes-dev.desci.com",
  },
  staging: {
    apiUrl: "https://nodes-api-staging.desci.com",
    ipfsGateway: "https://ipfs.desci.com/ipfs",
    webUrl: "https://nodes-staging.desci.com",
  },
  prod: {
    apiUrl: "https://nodes-api.desci.com",
    ipfsGateway: "https://ipfs.desci.com/ipfs",
    webUrl: "https://nodes.desci.com",
  },
} as const;

export function getEnvConfig() {
  const env = config.get("environment") || "dev";
  return ENV_CONFIGS[env];
}

export function getApiKey(): string | undefined {
  return config.get("apiKey");
}

export function setApiKey(key: string): void {
  config.set("apiKey", key);
}

export function setEnvironment(env: Environment): void {
  config.set("environment", env);
}

export function getEnvironment(): Environment {
  return config.get("environment") || "dev";
}

export function clearConfig(): void {
  config.clear();
}

export function printCurrentConfig(): void {
  const env = getEnvironment();
  const apiKey = getApiKey();
  const envConfig = getEnvConfig();

  console.log(chalk.bold("\n📋 Current Configuration\n"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(`${chalk.cyan("Environment:")}  ${chalk.yellow(env)}`);
  console.log(`${chalk.cyan("API URL:")}      ${envConfig.apiUrl}`);
  console.log(`${chalk.cyan("IPFS Gateway:")} ${envConfig.ipfsGateway}`);
  console.log(`${chalk.cyan("Web URL:")}      ${envConfig.webUrl}`);
  console.log(
    `${chalk.cyan("API Key:")}      ${apiKey ? chalk.green("✓ configured") : chalk.red("✗ not set")}`,
  );
  console.log(chalk.dim("─".repeat(40)));
  console.log(chalk.dim(`\nConfig stored at: ${config.path}\n`));
}
