# Installation

This guide covers all installation options for PTL.

## Requirements

| Requirement | Minimum Version     |
| ----------- | ------------------- |
| Node.js     | 20.0.0              |
| pnpm        | 8.0.0 (recommended) |
| npm         | 10.0.0              |
| yarn        | 4.0.0               |

## Package Options

PTL is distributed as several packages:

| Package            | Description                | Use Case                 |
| ------------------ | -------------------------- | ------------------------ |
| `@ptl/cli`         | Command-line interface     | CI/CD, local analysis    |
| `@ptl/core`        | Core inference engine      | Programmatic integration |
| `@ptl/shared`      | Shared types and utilities | Building on PTL          |
| `@ptl/type-priors` | Type prior databases       | Custom prior databases   |

## CLI Installation

### Global Installation

Install globally for easy access from anywhere:

::: code-group

```bash [pnpm]
pnpm add -g @ptl/cli
```

```bash [npm]
npm install -g @ptl/cli
```

:::

Verify installation:

```bash
ptl --version
# PTL v0.1.0
```

### Local Installation

Install as a dev dependency for project-specific use:

::: code-group

```bash [pnpm]
pnpm add -D @ptl/cli
```

```bash [npm]
npm install -D @ptl/cli
```

:::

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "typecheck": "ptl analyze src/",
    "typecheck:report": "ptl report src/ --format=json > type-report.json"
  }
}
```

## Core Library

For programmatic use, install the core library:

::: code-group

```bash [pnpm]
pnpm add @ptl/core
```

```bash [npm]
npm install @ptl/core
```

:::

```typescript
import { BayesianTypeInference, TypeLattice } from '@ptl/core';

const lattice = new TypeLattice();
const inference = new BayesianTypeInference(lattice);

const result = inference.inferType(astNode, context);
console.log(result.type, result.confidence);
```

## VS Code Extension

### From Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for "PTL - Probabilistic Type Lattice"
4. Click Install

### From VSIX

Download the latest `.vsix` file from
[GitHub Releases](https://github.com/iamthegreatdestroyer/PTL/releases) and install:

```bash
code --install-extension ptl-vscode-0.1.0.vsix
```

## Monorepo Setup

For monorepos using pnpm workspaces:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// package.json (root)
{
  "devDependencies": {
    "@ptl/cli": "workspace:*"
  }
}
```

## Docker

Use PTL in Docker for CI/CD:

```dockerfile
FROM node:20-alpine

RUN npm install -g pnpm @ptl/cli

WORKDIR /app
COPY . .

RUN ptl analyze src/ --format=json > /output/report.json
```

## Verification

Verify your installation:

```bash
# Check CLI
ptl --version
ptl --help

# Test analysis
echo 'const x = 42;' > test.ts
ptl analyze test.ts
rm test.ts
```

Expected output:

```
test.ts

  Line 1, Column 7: x
    Type: number (99% confidence)
    Confidence interval: [98%, 100%]
```

## Troubleshooting

### Common Issues

**Error: Node.js version too old**

PTL requires Node.js 20+. Update Node.js:

```bash
# Using nvm
nvm install 20
nvm use 20
```

**Error: pnpm not found**

Install pnpm:

```bash
npm install -g pnpm
```

**VS Code extension not working**

1. Reload VS Code: `Ctrl+Shift+P` → "Reload Window"
2. Check that the extension is enabled
3. Ensure the workspace contains `.ts` or `.js` files

## Next Steps

- [Quick Start](/guide/quick-start) - Analyze your first project
- [Configuration](/guide/configuration) - Customize PTL settings
- [CLI Reference](/guide/cli) - All CLI commands
