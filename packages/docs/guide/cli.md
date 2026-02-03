# CLI Reference

Complete reference for the PTL command-line interface.

## Installation

```bash
pnpm add -g @ptl/cli
# or
pnpm add -D @ptl/cli
```

## Commands

### `ptl analyze`

Analyze files or directories for type inference.

```bash
ptl analyze [paths...] [options]
```

**Arguments:**

| Argument | Description                     | Default           |
| -------- | ------------------------------- | ----------------- |
| `paths`  | Files or directories to analyze | Current directory |

**Options:**

| Option        | Alias | Description         | Default         |
| ------------- | ----- | ------------------- | --------------- |
| `--config`    | `-c`  | Path to config file | `ptl.config.ts` |
| `--format`    | `-f`  | Output format       | `pretty`        |
| `--threshold` | `-t`  | Minimum confidence  | `0`             |
| `--output`    | `-o`  | Output file         | stdout          |
| `--watch`     | `-w`  | Watch mode          | `false`         |
| `--verbose`   | `-v`  | Verbose output      | `false`         |
| `--quiet`     | `-q`  | Quiet mode          | `false`         |

**Formats:**

- `pretty` - Colored terminal output
- `json` - JSON output
- `csv` - CSV output
- `markdown` - Markdown table

**Examples:**

```bash
# Analyze current directory
ptl analyze

# Analyze specific files
ptl analyze src/index.ts src/utils.ts

# Analyze with JSON output
ptl analyze src/ --format=json

# Watch mode
ptl analyze src/ --watch

# Only show low confidence
ptl analyze src/ --threshold=0.6 --below
```

### `ptl report`

Generate detailed analysis reports.

```bash
ptl report [paths...] [options]
```

**Options:**

| Option             | Alias | Description               | Default   |
| ------------------ | ----- | ------------------------- | --------- |
| `--format`         | `-f`  | Report format             | `summary` |
| `--output`         | `-o`  | Output file               | stdout    |
| `--include-high`   |       | Include high confidence   | `true`    |
| `--include-medium` |       | Include medium confidence | `true`    |
| `--include-low`    |       | Include low confidence    | `true`    |

**Formats:**

- `summary` - Brief summary statistics
- `detailed` - Full detailed report
- `json` - Machine-readable JSON
- `html` - HTML report

**Examples:**

```bash
# Summary report
ptl report src/

# Detailed report to file
ptl report src/ --format=detailed --output=report.md

# HTML report
ptl report src/ --format=html --output=report.html

# Only low confidence items
ptl report src/ --include-high=false --include-medium=false
```

### `ptl init`

Initialize PTL configuration.

```bash
ptl init [options]
```

**Options:**

| Option         | Description               | Default |
| -------------- | ------------------------- | ------- |
| `--typescript` | Use TypeScript config     | `true`  |
| `--force`      | Overwrite existing config | `false` |

**Examples:**

```bash
# Create default config
ptl init

# Force overwrite
ptl init --force
```

### `ptl check`

Check if types meet confidence thresholds.

```bash
ptl check [paths...] [options]
```

**Options:**

| Option          | Alias | Description                   | Default |
| --------------- | ----- | ----------------------------- | ------- |
| `--min-average` |       | Minimum average confidence    | `0.7`   |
| `--max-low`     |       | Maximum low confidence count  | `10`    |
| `--strict`      |       | Strict mode (fail on any low) | `false` |

**Examples:**

```bash
# Basic check
ptl check src/

# Strict mode
ptl check src/ --strict

# CI-friendly check
ptl check src/ --min-average=0.8 --max-low=5
```

### `ptl explain`

Explain inference for a specific location.

```bash
ptl explain <file> <line> <column>
```

**Examples:**

```bash
# Explain type at line 10, column 5
ptl explain src/index.ts 10 5
```

### `ptl priors`

Manage type priors.

```bash
ptl priors <subcommand> [options]
```

**Subcommands:**

- `list` - List available prior databases
- `info` - Show prior database info
- `update` - Update prior databases
- `create` - Create custom prior database

**Examples:**

```bash
# List priors
ptl priors list

# Update priors
ptl priors update

# Create custom priors
ptl priors create my-priors --from=src/
```

## Configuration

### Config File

Create `ptl.config.ts` in your project root:

```typescript
import { defineConfig } from '@ptl/cli';

export default defineConfig({
  // Analysis settings
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],

  // Confidence thresholds
  highConfidenceThreshold: 0.85,
  mediumConfidenceThreshold: 0.6,

  // Prior configuration
  priors: {
    sources: ['builtin', 'typescript', 'react'],
    custom: './priors.json',
  },

  // Output settings
  output: {
    format: 'pretty',
    colors: true,
    showAlternatives: true,
    maxAlternatives: 3,
  },

  // Performance
  performance: {
    maxFiles: 1000,
    timeout: 30000,
    parallel: true,
  },
});
```

### Environment Variables

| Variable        | Description                | Default         |
| --------------- | -------------------------- | --------------- |
| `PTL_CONFIG`    | Config file path           | `ptl.config.ts` |
| `PTL_CACHE_DIR` | Cache directory            | `.ptl-cache`    |
| `PTL_PARALLEL`  | Enable parallel processing | `true`          |
| `PTL_DEBUG`     | Enable debug output        | `false`         |
| `NO_COLOR`      | Disable colors             | `false`         |

## Exit Codes

| Code | Description                       |
| ---- | --------------------------------- |
| `0`  | Success                           |
| `1`  | Analysis error                    |
| `2`  | Check failed (thresholds not met) |
| `3`  | Configuration error               |
| `4`  | File not found                    |

## Examples

### CI Integration

```yaml
# GitHub Actions
- name: Type Analysis
  run: |
    pnpm exec ptl check src/ --min-average=0.75
```

### Git Pre-Commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

pnpm exec ptl check src/ --strict
```

### Watch Mode Development

```bash
ptl analyze src/ --watch --format=pretty
```
