# Quick Start

Get PTL running in your project in just a few minutes.

## Prerequisites

- Node.js 20.0.0 or higher
- pnpm 8.0.0 or higher (recommended) or npm/yarn

## Installation

::: code-group

```bash [pnpm]
pnpm add -D @ptl/cli
```

```bash [npm]
npm install -D @ptl/cli
```

```bash [yarn]
yarn add -D @ptl/cli
```

:::

## Basic Usage

### 1. Analyze Your Code

Run PTL on your source directory:

```bash
ptl analyze src/
```

You'll see output like:

```
PTL v0.1.0 - Probabilistic Type Lattice

Analyzing src/...

Found 42 files, 156 functions, 312 variables

Results:
  🟢 High confidence (85%+):   234 (75%)
  🟡 Medium confidence (60-84%): 58 (19%)
  🔴 Low confidence (<60%):      20 (6%)

Average confidence: 82.4%
```

### 2. View Detailed Report

Get a detailed breakdown:

```bash
ptl report src/ --format=detailed
```

### 3. Check Specific Files

Analyze individual files:

```bash
ptl analyze src/utils.ts
```

## Configuration

Create a `ptl.config.ts` file for custom settings:

```typescript
import { defineConfig } from '@ptl/cli';

export default defineConfig({
  // Minimum confidence threshold for "high confidence"
  highConfidenceThreshold: 0.85,

  // Minimum confidence threshold for "medium confidence"
  mediumConfidenceThreshold: 0.6,

  // Files to analyze
  include: ['src/**/*.ts', 'src/**/*.tsx'],

  // Files to exclude
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
});
```

## VS Code Integration

Install the PTL VS Code extension for inline type hints:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "PTL"
4. Click Install

The extension provides:

- Inline type hints with confidence percentages
- Hover information with alternative types
- Problems panel integration for low-confidence areas
- Type explorer in the sidebar

## Example Output

Here's what PTL analysis looks like for a simple function:

```typescript
// src/greet.ts
function greet(name) {
  return 'Hello, ' + name;
}

const result = greet('World');
```

PTL output:

```
src/greet.ts

  Line 2, Column 16: name
    Type: string (92% confidence)
    Confidence interval: [87%, 96%]
    Alternatives:
      - any: 5%
      - unknown: 3%

  Line 3, Column 3: <return>
    Type: string (98% confidence)
    Confidence interval: [95%, 100%]

  Line 6, Column 7: result
    Type: string (98% confidence)
    Confidence interval: [95%, 100%]
```

## Next Steps

- [Installation](/guide/installation) - More installation options
- [Core Concepts](/guide/core-concepts) - Understand how PTL works
- [CLI Reference](/guide/cli) - All CLI commands and options
- [VS Code Extension](/guide/vscode) - Extension features and settings
