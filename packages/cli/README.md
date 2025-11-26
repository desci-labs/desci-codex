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

# 5. Update an existing node with new changes
codex push ./my-research --node <uuid> --prepublish
```

---

## Commands

### `codex init`

Interactive setup wizard to configure your API key and environment.

```bash
codex init
```

This will prompt you to:
1. Select an environment (dev, staging, prod, local)
2. Enter your API key (get one from your profile at nodes.desci.com)

---

### `codex push`

Push a folder or files to a DeSci node. Files are uploaded and existing files with the same name are **overwritten**.

```bash
codex push [path] [options]
```

**Arguments:**
| Argument | Description | Default |
|----------|-------------|---------|
| `path` | Path to folder or file(s) to upload | `.` (current directory) |

**Options:**
| Flag | Description |
|------|-------------|
| `-n, --node <uuid>` | Target node UUID (supports partial matching) |
| `-t, --target <path>` | Target path in node drive | `root` |
| `--new` | Create a new node for this upload |
| `--title <title>` | Title for new node (used with `--new`) |
| `--clean` | Remove remote files that don't exist locally (like `rsync --delete`) |
| `--dry-run` | Preview changes without making any modifications |
| `--prepublish` | Finalize as a new version after upload (v1 → v2) |
| `-v, --verbose` | Show detailed output including file comparisons |

**Examples:**

```bash
# Push current directory to a new node
codex push --new --title "My Dataset"

# Push a specific folder to a new node
codex push ./data --new --title "Experiment Results 2024"

# Update an existing node (interactive selection)
codex push ./updated-files

# Update a specific node by UUID
codex push ./data --node abc123

# Update and create a new version
codex push ./data --node abc123 --prepublish

# Push to a specific path within the node
codex push ./code --node abc123 --target root/src

# Full sync - remove files that don't exist locally
codex push ./data --node abc123 --clean

# Preview what would change (dry run)
codex push ./data --node abc123 --dry-run

# Preview with verbose output
codex push ./data --node abc123 --dry-run --verbose
```

**Behavior:**
- **New files** → Added to the node
- **Changed files** → Overwritten (deleted and re-uploaded)
- **Deleted files** → Kept by default, removed with `--clean`

**Versioning:**
- Without `--prepublish`: Changes are saved as a **draft**
- With `--prepublish`: Changes are finalized as a **new version** (v1 → v2)

---

### `codex pull`

Download files from a DeSci node to a local folder.

```bash
codex pull [node] [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `node` | Node UUID or partial UUID (optional - shows picker if omitted) |

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <path>` | Output directory | `.` |
| `-p, --path <path>` | Path within node to pull | `root` |
| `--published` | Pull from published version (not draft) | - |

**Examples:**

```bash
# Interactive node selection
codex pull

# Pull from a specific node (full UUID)
codex pull oxblWFLYHH_EtYUXIBqT6pIBBfSOatICSyjxGduzVjs

# Pull using partial UUID
codex pull oxblWF

# Pull to a specific directory
codex pull abc123 -o ./downloads

# Pull only a specific subfolder
codex pull abc123 --path root/data -o ./just-data

# Pull the published version (not draft)
codex pull abc123 --published
```

---

### `codex list` (alias: `codex ls`)

List your nodes or files within a specific node.

```bash
codex list [node] [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `node` | Node UUID to list files from (optional) |

**Options:**
| Flag | Description |
|------|-------------|
| `-a, --all` | Show all details (UUID, status, CID, URL) |
| `-t, --tree` | Show file tree structure for node |

**Examples:**

```bash
# List all your nodes (table view)
codex list

# List with full details
codex list --all

# List files in a specific node
codex list abc123

# Show file tree structure
codex list abc123 --tree
```

**Output (default):**
```
🔬 Your Nodes (3)

  Title                         UUID          Status      Updated
  ──────────────────────────────────────────────────────────────────
  My Research Project           oxblWFLY...   Published   2h ago
  Experiment Data               a1b2c3d4...   Draft       1d ago
  Conference Paper              x9y8z7w6...   Published   3d ago
```

---

### `codex config`

Manage CLI configuration (API key, environment).

```bash
codex config [options]
codex config login
codex config logout
```

**Options:**
| Flag | Description |
|------|-------------|
| `-k, --api-key <key>` | Set API key directly |
| `-e, --env <env>` | Set environment (`local`, `dev`, `staging`, `prod`) |
| `--show` | Show current configuration |
| `--clear` | Clear all configuration |

**Subcommands:**
| Command | Description |
|---------|-------------|
| `codex config login` | Interactive login setup |
| `codex config logout` | Clear saved credentials |

**Examples:**

```bash
# Show current config
codex config

# Interactive login
codex config login

# Set API key directly
codex config --api-key sk_abc123...

# Switch to production environment
codex config --env prod

# Clear all settings
codex config --clear

# Logout
codex config logout
```

---

### `codex status`

Show current CLI status and test the connection.

```bash
codex status
```

**Output:**
```
Status

  Environment: dev
  API Key:     ✓ configured
  API URL:     https://nodes-api-dev.desci.com
  Web URL:     https://nodes-dev.desci.com

Testing connection...
✓ Connected - 5 nodes found
```

---

### `codex open`

Open a node in your web browser.

```bash
codex open <node>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `node` | Node UUID or partial UUID |

**Examples:**

```bash
# Open by full UUID
codex open oxblWFLYHH_EtYUXIBqT6pIBBfSOatICSyjxGduzVjs

# Open by partial UUID
codex open oxblWF
```

---

### `codex sync`

Sync a local folder with a node. Currently an alias for `push`.

```bash
codex sync <path> <node> [options]
```

**Options:**
| Flag | Description |
|------|-------------|
| `--dry-run` | Show what would be synced without making changes |

**Examples:**

```bash
# Sync folder with node
codex sync ./my-data abc123

# Preview sync
codex sync ./my-data abc123 --dry-run
```

---

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

---

## Common Workflows

### Create a new research node

```bash
# One command
codex push ./my-experiment --new --title "Quantum Simulation Results 2024" --prepublish

# Step by step
codex push --new --title "My Project"
# Note the UUID from output, then:
codex push ./data --node <uuid> --target root/data
codex push ./code --node <uuid> --target root/code --prepublish
```

### Update an existing node

```bash
# Make local changes, then push
codex push ./my-project --node abc123 --prepublish

# Preview changes first
codex push ./my-project --node abc123 --dry-run

# Full sync (remove deleted files)
codex push ./my-project --node abc123 --clean --prepublish
```

### Download a node's contents

```bash
# Pull entire node
codex pull abc123 -o ./backup

# Pull just the data folder
codex pull abc123 --path root/data -o ./just-data
```

### Partial UUID matching

The CLI supports partial UUID matching for convenience:

```bash
# These all work if there's a unique match
codex pull abc123
codex pull abc
codex list abc
codex open abc
codex push ./data --node abc
```

If multiple nodes match, you'll be prompted to select one.

---

## Versioning

DeSci Nodes track version history. When you push changes:

| Action | Result |
|--------|--------|
| `codex push ./data --node abc123` | Changes saved as **draft** (not versioned) |
| `codex push ./data --node abc123 --prepublish` | Changes finalized as **new version** (v1 → v2) |

The `--prepublish` flag computes the new manifest CID and prepares the node for publishing. Without it, changes remain in draft state and won't appear as a new version in the node's history.

---

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

# Run without linking
node dist/index.js push --help
```

---

## License

MIT
