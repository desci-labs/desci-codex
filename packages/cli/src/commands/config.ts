import { Command } from "commander";
import chalk from "chalk";
import { select, input, confirm } from "../prompts.js";
import {
  setApiKey,
  getEnvironment,
  setEnvironment,
  printCurrentConfig,
  clearConfig,
  type Environment,
  ENV_CONFIGS,
} from "../config.js";
import { printSuccess, printError, symbols } from "../ui.js";

export function createConfigCommand(): Command {
  const cmd = new Command("config")
    .description("Manage CLI configuration")
    .option("-k, --api-key <key>", "Set API key")
    .option(
      "-e, --env <environment>",
      "Set environment (local/dev/staging/prod)",
    )
    .option("--show", "Show current configuration")
    .option("--clear", "Clear all configuration")
    .action(async (options) => {
      try {
        // Handle --clear
        if (options.clear) {
          const confirmed = await confirm({
            message: "Are you sure you want to clear all configuration?",
            default: false,
          });

          if (confirmed) {
            clearConfig();
            printSuccess("Configuration cleared");
          }
          return;
        }

        // Handle --api-key
        if (options.apiKey) {
          setApiKey(options.apiKey);
          printSuccess("API key updated");
        }

        // Handle --env
        if (options.env) {
          const validEnvs: Environment[] = ["local", "dev", "staging", "prod"];
          if (!validEnvs.includes(options.env as Environment)) {
            printError(`Invalid environment: ${options.env}`);
            console.log(chalk.dim(`Valid options: ${validEnvs.join(", ")}`));
            process.exit(1);
          }
          setEnvironment(options.env as Environment);
          printSuccess(`Environment set to: ${options.env}`);
        }

        // If --show or no options, display current config
        if (
          options.show ||
          (!options.apiKey && !options.env && !options.clear)
        ) {
          printCurrentConfig();
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        printError(`Config error: ${message}`);
        process.exit(1);
      }
    });

  // Add login subcommand
  cmd
    .command("login")
    .description("Interactive login setup")
    .action(async () => {
      try {
        console.log(`\n${symbols.key} ${chalk.bold("DeSci Codex Login")}\n`);

        // Select environment
        const currentEnv = getEnvironment();
        const envChoices = [
          {
            name: "dev",
            message: `Development ${chalk.dim("(nodes-dev.desci.com)")}`,
            value: "dev",
          },
          {
            name: "staging",
            message: `Staging ${chalk.dim("(nodes-staging.desci.com)")}`,
            value: "staging",
          },
          {
            name: "prod",
            message: `Production ${chalk.dim("(nodes.desci.com)")}`,
            value: "prod",
          },
          {
            name: "local",
            message: `Local ${chalk.dim("(localhost:5420)")}`,
            value: "local",
          },
        ];

        const env = await select<Environment>({
          message: "Select environment:",
          choices: envChoices,
          initial:
            currentEnv === "dev"
              ? 0
              : currentEnv === "staging"
                ? 1
                : currentEnv === "prod"
                  ? 2
                  : 3,
        });

        setEnvironment(env);

        const envConfig = ENV_CONFIGS[env];
        console.log(
          `\n${symbols.info} Get your API key from: ${chalk.cyan(envConfig.webUrl)}`,
        );
        console.log(chalk.dim("  Go to Profile → API Keys → Create New Key\n"));

        // Get API key
        const apiKey = await input({
          message: "Enter your API key:",
          validate: (value: string) => {
            if (!value || value.length < 10) {
              return "Please enter a valid API key";
            }
            return true;
          },
        });

        setApiKey(apiKey);

        printSuccess("Login successful!");
        console.log(
          chalk.dim(
            `\nYou can now use 'codex push' and 'codex pull' commands.\n`,
          ),
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        printError(`Login failed: ${message}`);
        process.exit(1);
      }
    });

  // Add logout subcommand
  cmd
    .command("logout")
    .description("Clear saved credentials")
    .action(async () => {
      const confirmed = await confirm({
        message: "Are you sure you want to logout?",
        default: false,
      });

      if (confirmed) {
        clearConfig();
        printSuccess("Logged out successfully");
      }
    });

  return cmd;
}
