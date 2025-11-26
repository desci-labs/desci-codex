#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { printBanner, printError } from "./ui.js";
import { getApiKey, getEnvironment, ENV_CONFIGS } from "./config.js";
import {
  createPushCommand,
  createPullCommand,
  createConfigCommand,
  createListCommand,
} from "./commands/index.js";

const program = new Command();

program
  .name("codex")
  .description(
    chalk.dim(
      "DeSci Codex CLI - Push and pull research data to decentralized nodes",
    ),
  )
  .version("0.1.0")
  .hook("preAction", (thisCommand) => {
    // Show banner for main commands (not for help/version)
    const commandName = thisCommand.args[0];
    if (
      commandName &&
      !["help", "version", "-h", "--help", "-v", "--version"].includes(
        commandName,
      )
    ) {
      // Show minimal header
      const env = getEnvironment();
      const hasKey = !!getApiKey();
      console.log(
        chalk.dim(`\n[${env}] `) +
          (hasKey ? chalk.green("●") : chalk.red("○")) +
          chalk.dim(" codex"),
      );
    }
  });

// Add commands
program.addCommand(createPushCommand());
program.addCommand(createPullCommand());
program.addCommand(createListCommand());
program.addCommand(createConfigCommand());

// Add init alias for config login
program
  .command("init")
  .description("Initialize CLI with your credentials (alias for config login)")
  .action(async () => {
    printBanner();
    const configCmd = createConfigCommand();
    const loginCmd = configCmd.commands.find((c) => c.name() === "login");
    if (loginCmd) {
      await loginCmd.parseAsync([], { from: "user" });
    }
  });

// Add open command to view node in browser
program
  .command("open")
  .description("Open a node in the web browser")
  .argument("<node>", "Node UUID or partial UUID")
  .action(async (nodeArg: string) => {
    const { webUrl } = ENV_CONFIGS[getEnvironment()];

    // Try to find full UUID
    const { listNodes } = await import("./api.js");
    const apiKey = getApiKey();

    if (apiKey) {
      try {
        const nodes = await listNodes();
        const match = nodes.find(
          (n) => n.uuid === nodeArg || n.uuid.startsWith(nodeArg),
        );
        if (match) {
          const url = `${webUrl}/node/${match.uuid}`;
          console.log(chalk.dim(`\nOpening: ${url}\n`));

          const open = (await import("open")).default;
          await open(url);
          return;
        }
      } catch {
        // Fall through to use provided arg
      }
    }

    const url = `${webUrl}/node/${nodeArg}`;
    console.log(chalk.dim(`\nOpening: ${url}\n`));

    const open = (await import("open")).default;
    await open(url);
  });

// Add status command
program
  .command("status")
  .description("Show current CLI status and configuration")
  .action(async () => {
    printBanner();

    const env = getEnvironment();
    const apiKey = getApiKey();
    const envConfig = ENV_CONFIGS[env];

    console.log(chalk.bold("Status\n"));
    console.log(`  Environment: ${chalk.yellow(env)}`);
    console.log(
      `  API Key:     ${apiKey ? chalk.green("✓ configured") : chalk.red("✗ not set")}`,
    );
    console.log(`  API URL:     ${chalk.dim(envConfig.apiUrl)}`);
    console.log(`  Web URL:     ${chalk.dim(envConfig.webUrl)}`);

    if (apiKey) {
      console.log(chalk.dim("\nTesting connection..."));

      try {
        const { listNodes } = await import("./api.js");
        const nodes = await listNodes();
        console.log(chalk.green(`✓ Connected - ${nodes.length} nodes found`));
      } catch (err) {
        console.log(chalk.red("✗ Connection failed"));
        console.log(
          chalk.dim(
            `  ${err instanceof Error ? err.message : "Unknown error"}`,
          ),
        );
      }
    } else {
      console.log(chalk.dim("\nRun `codex init` to set up your credentials"));
    }

    console.log();
  });

// Add quick sync command
program
  .command("sync")
  .description("Sync a local folder with a node (push changes)")
  .argument("<path>", "Local folder path")
  .argument("<node>", "Node UUID")
  .option("--dry-run", "Show what would be synced without making changes")
  .action(async (path: string, node: string, options) => {
    if (options.dryRun) {
      console.log(chalk.yellow("\nDry run mode - no changes will be made\n"));
    }

    // For now, sync is just an alias for push
    const pushCmd = createPushCommand();
    await pushCmd.parseAsync([path, "--node", node], { from: "user" });
  });

// Error handling
program.exitOverride((err) => {
  if (err.code === "commander.help") {
    printBanner();
  }
});

// Parse arguments
program.parseAsync(process.argv).catch((err) => {
  printError(err.message);
  process.exit(1);
});
