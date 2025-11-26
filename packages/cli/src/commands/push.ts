import { Command } from "commander";
import { existsSync, statSync } from "fs";
import { resolve, basename } from "path";
import { glob } from "glob";
import chalk from "chalk";
import { select, input, confirm } from "../prompts.js";
import {
  listNodes,
  createNode,
  uploadFolder,
  uploadFiles as uploadFilesApi,
  getNode,
  getDriveTree,
  deleteData,
  prepublish,
  type DriveItem,
} from "../api.js";
import {
  createSpinner,
  printSuccess,
  printError,
  printNodeInfo,
  formatBytes,
  symbols,
} from "../ui.js";
import { getApiKey } from "../config.js";

// Normalize a path by removing root/ or /root/ prefix
function normalizePath(path: string): string {
  let normalized = path;
  // Remove leading slash
  if (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }
  // Remove "root/" prefix
  if (normalized.startsWith("root/")) {
    normalized = normalized.slice(5);
  }
  // Handle case where path is just "root"
  if (normalized === "root") {
    normalized = "";
  }
  return normalized;
}

// Collect all file paths from a drive tree (normalized without root/ prefix)
function collectRemotePaths(items: DriveItem[], prefix = ""): Set<string> {
  const paths = new Set<string>();
  for (const item of items) {
    // Use item.path if available, otherwise build from prefix
    let itemPath = item.path || (prefix ? `${prefix}/${item.name}` : item.name);

    // Normalize the path
    itemPath = normalizePath(itemPath);

    if (item.type === "file") {
      paths.add(itemPath);
    } else if (item.type === "dir" && item.contains) {
      // For directories, recurse with the current path as prefix
      const dirPrefix = itemPath;
      for (const p of collectRemotePaths(item.contains, dirPrefix)) {
        paths.add(p);
      }
    }
  }
  return paths;
}

// Collect local file paths relative to a folder
async function collectLocalPaths(folderPath: string): Promise<Set<string>> {
  const files = await glob("**/*", {
    cwd: folderPath,
    nodir: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/.DS_Store"],
  });
  return new Set(files);
}

export function createPushCommand(): Command {
  return new Command("push")
    .description(
      "Push a folder or files to a DeSci node (overwrites existing files)",
    )
    .argument("[path]", "Path to folder or file(s) to upload", ".")
    .option("-n, --node <uuid>", "Target node UUID")
    .option("-t, --target <path>", "Target path in node drive", "root")
    .option("--new", "Create a new node for this upload")
    .option("--title <title>", "Title for new node")
    .option(
      "--clean",
      "Remove remote files that don't exist locally (like rsync --delete)",
    )
    .option("--dry-run", "Show what would be changed without making changes")
    .option("--prepublish", "Prepare node for publishing after upload")
    .option("-v, --verbose", "Show detailed output")
    .action(async (path: string, options) => {
      try {
        // Check API key
        if (!getApiKey()) {
          printError(
            "No API key configured. Run: codex config --api-key <key>",
          );
          process.exit(1);
        }

        // Resolve path
        const sourcePath = resolve(process.cwd(), path);
        if (!existsSync(sourcePath)) {
          printError(`Path does not exist: ${sourcePath}`);
          process.exit(1);
        }

        const isDirectory = statSync(sourcePath).isDirectory();
        const itemName = basename(sourcePath);

        console.log(
          `\n${symbols.folder} ${chalk.bold("Source:")} ${chalk.cyan(sourcePath)}`,
        );
        console.log(
          `${symbols.info} ${chalk.bold("Type:")} ${isDirectory ? "Folder" : "File"}`,
        );

        if (options.dryRun) {
          console.log(
            chalk.yellow(
              `${symbols.warning} Dry run mode - no changes will be made`,
            ),
          );
        }
        console.log();

        let targetUuid = options.node;
        let isNewNode = false;

        // Create new node or select existing
        if (options.new || !targetUuid) {
          if (options.new) {
            // Create new node
            const title =
              options.title ||
              (await input({
                message: "Enter a title for the new node:",
                default: itemName,
              }));

            if (options.dryRun) {
              console.log(chalk.dim(`Would create new node: "${title}"`));
              process.exit(0);
            }

            const spinner = createSpinner("Creating new node...");
            spinner.start();

            try {
              const { uuid, node } = await createNode(title);
              targetUuid = uuid;
              isNewNode = true;
              spinner.succeed(`Created node: ${chalk.cyan(title)}`);
              printNodeInfo({
                uuid,
                title: node.title,
                isPublished: false,
              });
            } catch (err) {
              spinner.fail("Failed to create node");
              throw err;
            }
          } else {
            // List existing nodes
            const spinner = createSpinner("Fetching your nodes...");
            spinner.start();

            const nodes = await listNodes();
            spinner.stop();

            if (nodes.length === 0) {
              console.log(chalk.yellow("\nNo existing nodes found.\n"));
              const createNew = await confirm({
                message: "Would you like to create a new node?",
                default: true,
              });

              if (createNew) {
                const title = await input({
                  message: "Enter a title for the new node:",
                  default: itemName,
                });

                if (options.dryRun) {
                  console.log(chalk.dim(`Would create new node: "${title}"`));
                  process.exit(0);
                }

                const createSpinner2 = createSpinner("Creating new node...");
                createSpinner2.start();
                const { uuid } = await createNode(title);
                targetUuid = uuid;
                isNewNode = true;
                createSpinner2.succeed(`Created node: ${chalk.cyan(title)}`);
              } else {
                process.exit(0);
              }
            } else {
              // Show node picker
              const choices = nodes.map((node) => ({
                name: node.uuid,
                message: `${node.title} ${chalk.dim(`(${node.uuid.slice(0, 8)}...)`)} ${
                  node.isPublished
                    ? chalk.green("● Published")
                    : chalk.yellow("○ Draft")
                }`,
                value: node.uuid,
              }));

              choices.unshift({
                name: "__new__",
                message: chalk.cyan("+ Create new node"),
                value: "__new__",
              });

              targetUuid = await select({
                message: "Select a node to push to:",
                choices,
              });

              if (targetUuid === "__new__") {
                const title = await input({
                  message: "Enter a title for the new node:",
                  default: itemName,
                });

                if (options.dryRun) {
                  console.log(chalk.dim(`Would create new node: "${title}"`));
                  process.exit(0);
                }

                const createSpinner3 = createSpinner("Creating new node...");
                createSpinner3.start();
                const { uuid } = await createNode(title);
                targetUuid = uuid;
                isNewNode = true;
                createSpinner3.succeed(`Created node: ${chalk.cyan(title)}`);
              }
            }
          }
        }

        // Verify node exists and get current state
        const spinner = createSpinner("Checking node...");
        spinner.start();

        let node;
        let remotePaths = new Set<string>();

        try {
          node = await getNode(targetUuid);
          spinner.text = "Analyzing current files...";

          // Get current file tree if updating existing node
          if (!isNewNode && isDirectory) {
            try {
              const tree = await getDriveTree(targetUuid);
              remotePaths = collectRemotePaths(tree);
            } catch {
              // Node might be empty, that's ok
            }
          }

          spinner.succeed(
            `Target: ${chalk.cyan(node.title)} ${isNewNode ? chalk.green("(new)") : chalk.yellow("(updating)")}`,
          );
        } catch (err) {
          spinner.fail(`Node not found: ${targetUuid}`);
          process.exit(1);
        }

        // Analyze changes if updating a directory
        const filesToDelete: string[] = [];
        let localPaths = new Set<string>();

        if (isDirectory && !isNewNode) {
          localPaths = await collectLocalPaths(sourcePath);

          // Debug output for verbose mode
          if (options.verbose) {
            console.log(chalk.dim("\n[verbose] Local files:"));
            [...localPaths]
              .slice(0, 5)
              .forEach((p) => console.log(chalk.dim(`  ${p}`)));
            if (localPaths.size > 5)
              console.log(chalk.dim(`  ... and ${localPaths.size - 5} more`));

            console.log(chalk.dim("\n[verbose] Remote files:"));
            [...remotePaths]
              .slice(0, 5)
              .forEach((p) => console.log(chalk.dim(`  ${p}`)));
            if (remotePaths.size > 5)
              console.log(chalk.dim(`  ... and ${remotePaths.size - 5} more`));
            console.log();
          }

          // Find files to delete (exist remotely but not locally)
          if (options.clean) {
            for (const remotePath of remotePaths) {
              if (!localPaths.has(remotePath)) {
                filesToDelete.push(remotePath);
              }
            }
          }

          // Show summary
          const newFiles = [...localPaths].filter((p) => !remotePaths.has(p));
          const updatedFiles = [...localPaths].filter((p) =>
            remotePaths.has(p),
          );

          console.log();
          console.log(chalk.bold("Changes to be applied:"));
          console.log(`  ${chalk.green("+")} ${newFiles.length} new files`);
          console.log(
            `  ${chalk.yellow("~")} ${updatedFiles.length} files to update/overwrite`,
          );
          if (options.clean) {
            console.log(
              `  ${chalk.red("-")} ${filesToDelete.length} files to delete`,
            );
          }

          if (options.dryRun) {
            console.log();
            if (newFiles.length > 0) {
              console.log(chalk.green("\nNew files:"));
              newFiles
                .slice(0, 10)
                .forEach((f) => console.log(chalk.dim(`  + ${f}`)));
              if (newFiles.length > 10)
                console.log(
                  chalk.dim(`  ... and ${newFiles.length - 10} more`),
                );
            }
            if (updatedFiles.length > 0) {
              console.log(chalk.yellow("\nFiles to overwrite:"));
              updatedFiles
                .slice(0, 10)
                .forEach((f) => console.log(chalk.dim(`  ~ ${f}`)));
              if (updatedFiles.length > 10)
                console.log(
                  chalk.dim(`  ... and ${updatedFiles.length - 10} more`),
                );
            }
            if (filesToDelete.length > 0) {
              console.log(chalk.red("\nFiles to delete:"));
              filesToDelete
                .slice(0, 10)
                .forEach((f) => console.log(chalk.dim(`  - ${f}`)));
              if (filesToDelete.length > 10)
                console.log(
                  chalk.dim(`  ... and ${filesToDelete.length - 10} more`),
                );
            }
            console.log(chalk.dim("\nRun without --dry-run to apply changes."));
            process.exit(0);
          }
        }

        // Delete remote files that don't exist locally (if --clean)
        if (filesToDelete.length > 0 && !options.dryRun) {
          const deleteSpinner = createSpinner(
            `Removing ${filesToDelete.length} old files...`,
          );
          deleteSpinner.start();

          let deleted = 0;
          for (const filePath of filesToDelete) {
            try {
              await deleteData(targetUuid, `root/${filePath}`);
              deleted++;
              deleteSpinner.text = `Removing old files... (${deleted}/${filesToDelete.length})`;
            } catch (err) {
              // File might already be deleted, continue
            }
          }

          deleteSpinner.succeed(`Removed ${deleted} old files`);
        }

        // Upload
        console.log();
        const uploadSpinner = createSpinner("Uploading files...");
        uploadSpinner.start();

        const startTime = Date.now();
        let lastUpdate = 0;

        try {
          let result;
          if (isDirectory) {
            result = await uploadFolder(
              targetUuid,
              sourcePath,
              options.target,
              (current, total, fileName) => {
                const now = Date.now();
                if (now - lastUpdate > 100) {
                  uploadSpinner.text = `Uploading ${chalk.cyan(fileName)} (${current}/${total})`;
                  lastUpdate = now;
                }
              },
            );
          } else {
            result = await uploadFilesApi(
              targetUuid,
              [sourcePath],
              options.target,
              (uploaded, total) => {
                const percent = Math.round((uploaded / total) * 100);
                uploadSpinner.text = `Uploading... ${percent}% (${formatBytes(uploaded)}/${formatBytes(total)})`;
              },
            );
          }

          const duration = Date.now() - startTime;
          uploadSpinner.succeed(
            `Upload complete in ${Math.round(duration / 1000)}s`,
          );

          console.log(
            `\n${symbols.info} Manifest CID: ${chalk.dim(result.manifestCid)}`,
          );

          // Prepublish if requested
          if (options.prepublish) {
            const prepubSpinner = createSpinner("Preparing for publish...");
            prepubSpinner.start();

            try {
              const prepubResult = await prepublish(targetUuid);
              prepubSpinner.succeed("Node prepared for publishing");
              console.log(
                `${symbols.info} Updated CID: ${chalk.dim(prepubResult.updatedManifestCid)}`,
              );
            } catch (err) {
              prepubSpinner.fail("Prepublish failed");
            }
          }

          if (options.prepublish) {
            printSuccess(
              isNewNode
                ? "Node created and new version prepared!"
                : "Node updated to new version!",
            );
          } else {
            printSuccess(
              isNewNode ? "Node created and files uploaded!" : "Draft updated!",
            );
            console.log(
              chalk.yellow(`\n${symbols.warning} Changes are in draft state.`),
            );
            console.log(
              chalk.dim(
                "   To finalize as a new version, use --prepublish flag",
              ),
            );
          }

          console.log(chalk.dim("\nNext steps:"));
          console.log(
            chalk.dim(
              `  • View in browser:  codex open ${targetUuid.slice(0, 8)}`,
            ),
          );
          console.log(
            chalk.dim(
              `  • Pull files:       codex pull ${targetUuid.slice(0, 8)}`,
            ),
          );
          console.log(
            chalk.dim(
              `  • Push more files:  codex push <folder> --node ${targetUuid.slice(0, 8)}`,
            ),
          );

          if (!options.prepublish) {
            console.log(
              chalk.dim(
                `  • Finalize version: codex push <folder> --node ${targetUuid.slice(0, 8)} --prepublish`,
              ),
            );
          }

          if (!options.clean && remotePaths.size > 0 && localPaths.size > 0) {
            const potentialDeletes = [...remotePaths].filter(
              (p) => !localPaths.has(p),
            ).length;
            if (potentialDeletes > 0) {
              console.log();
              console.log(
                chalk.dim(
                  `  Tip: ${potentialDeletes} files exist in node but not locally.`,
                ),
              );
              console.log(chalk.dim(`       Use --clean to remove them.`));
            }
          }
        } catch (err) {
          uploadSpinner.fail("Upload failed");
          throw err;
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        printError(`Push failed: ${message}`);
        process.exit(1);
      }
    });
}
