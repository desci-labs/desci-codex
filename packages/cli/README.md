# @desci-labs/codex-cli

A user-friendly CLI for pushing and pulling research data to/from DeSci Nodes.

```
   ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝
  ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ 
  ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ 
  ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗
   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
```

## Installation

```bash
# From npm (when published)
npm install -g @desci-labs/codex-cli

# From source
cd packages/cli
pnpm install
pnpm build
npm link
```

## Quick Start

```bash
# 1. Initialize with your API key
codex init

# 2. Push a folder to a new node
codex push ./my-research --new --title "My Research Project"

# 3. List your nodes
codex list

# 4. Pull files from a node
codex pull <node-uuid> -o ./downloaded
```

## Commands

### `codex init`

Interactive setup to configure your API key and environment.

```bash
codex init
```

### `codex push`

Upload a folder or files to a DeSci node.

```bash
# Push current directory to a new node
codex push --new

# Push a specific folder
codex push ./data --new --title "Dataset v1"

# Push to an existing node
codex push ./updates --node abc123

# Push to a specific path in the node
codex push ./code --node abc123 --target root/src

# Prepare for publishing after upload
codex push ./final --node abc123 --prepublish
```

**Options:**
- `-n, --node <uuid>` - Target node UUID
- `-t, --target <path>` - Target path in node drive (default: `root`)
- `--new` - Create a new node for this upload
- `--title <title>` - Title for new node
- `--prepublish` - Prepare node for publishing after upload

### `codex pull`

Download files from a DeSci node to a local folder.

```bash
# Interactive node selection
codex pull

# Pull from a specific node
codex pull abc123

# Pull to a specific directory
codex pull abc123 -o ./downloads

# Pull only a specific path
codex pull abc123 --path root/data
```

**Options:**
- `-o, --output <path>` - Output directory (default: `.`)
- `-p, --path <path>` - Path within node to pull (default: `root`)
- `--published` - Pull from published version (not draft)

### `codex list` (alias: `codex ls`)

List your nodes or files within a node.

```bash
# List all nodes
codex list

# List with full details
codex list --all

# List files in a specific node
codex list abc123

# Show file tree
codex list abc123 --tree
```

**Options:**
- `-a, --all` - Show all details
- `-t, --tree` - Show file tree for node

### `codex config`

Manage CLI configuration.

```bash
# Show current config
codex config

# Set API key
codex config --api-key <key>

# Set environment
codex config --env dev

# Interactive login
codex config login

# Clear all config
codex config --clear
```

### `codex status`

Show current CLI status and test connection.

```bash
codex status
```

### `codex open`

Open a node in your web browser.

```bash
codex open abc123
```

### `codex sync`

Sync a local folder with a node (currently an alias for push).

```bash
codex sync ./my-folder abc123
```

## Configuration

The CLI stores configuration in:
- **macOS:** `~/Library/Preferences/desci-codex-cli-nodejs/config.json`
- **Linux:** `~/.config/desci-codex-cli-nodejs/config.json`
- **Windows:** `%APPDATA%\desci-codex-cli-nodejs\Config\config.json`

### Environments

| Environment | API URL | Web URL |
|-------------|---------|---------|
| `local` | `http://localhost:5420` | `http://localhost:3000` |
| `dev` | `https://nodes-api-dev.desci.com` | `https://nodes-dev.desci.com` |
| `staging` | `https://nodes-api-staging.desci.com` | `https://nodes-staging.desci.com` |
| `prod` | `https://nodes-api.desci.com` | `https://nodes.desci.com` |

## Examples

### Create a new research node and upload data

```bash
# Create node and upload in one command
codex push ./my-experiment --new --title "Quantum Simulation Results 2024"

# Or step by step
codex push --new --title "My Project"
codex push ./data --node <uuid-from-above> --target root/data
codex push ./code --node <uuid> --target root/code
```

### Download a node's contents

```bash
# Pull entire node
codex pull abc123 -o ./backup

# Pull just the data folder
codex pull abc123 --path root/data -o ./just-data
```

### Work with partial UUIDs

The CLI supports partial UUID matching:

```bash
# These all work if there's a unique match
codex pull abc123
codex pull abc
codex list abc123
codex open abc
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development mode
pnpm dev push --help

# Link globally for testing
npm link
```

## License

MIT


