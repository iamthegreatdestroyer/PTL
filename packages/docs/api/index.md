# API Overview

Programmatic access to PTL's type inference engine.

## Installation

```bash
pnpm add @ptl/core
```

## Quick Start

```typescript
import { BayesianTypeInference, TypeLattice, createDefaultPriors } from '@ptl/core';

// Create the inference engine
const lattice = new TypeLattice();
const priors = createDefaultPriors();
const inference = new BayesianTypeInference(lattice, priors);

// Analyze code
const sourceCode = `
  function greet(name) {
    return "Hello, " + name;
  }
`;

const results = inference.analyzeSource(sourceCode);

for (const result of results) {
  console.log(`${result.name}: ${result.type} (${result.confidence * 100}%)`);
}
```

## Core Classes

### BayesianTypeInference

The main inference engine.

```typescript
import { BayesianTypeInference } from '@ptl/core';

const inference = new BayesianTypeInference(lattice, priors, options);
```

**Methods:**

| Method                     | Description                  |
| -------------------------- | ---------------------------- |
| `analyzeSource(code)`      | Analyze source code string   |
| `analyzeFile(path)`        | Analyze a file               |
| `analyzeAST(ast)`          | Analyze an AST node          |
| `inferType(node, context)` | Infer type for a single node |

[Full API Reference →](/api/bayesian-type-inference)

### TypeLattice

Type lattice with subtyping relationships.

```typescript
import { TypeLattice } from '@ptl/core';

const lattice = new TypeLattice();

// Check subtyping
lattice.isSubtype('string', 'primitive'); // true

// Get join (least upper bound)
lattice.join('string', 'number'); // 'primitive'

// Get meet (greatest lower bound)
lattice.meet('string', 'number'); // 'never'
```

[Full API Reference →](/api/type-lattice)

### PriorDatabase

Prior probabilities for Bayesian inference.

```typescript
import { PriorDatabase, createDefaultPriors } from '@ptl/core';

const priors = createDefaultPriors();

// Query priors
priors.getPrior('name', 'parameter'); // 0.8 for string

// Add custom priors
priors.addPrior({
  pattern: /^on[A-Z]/,
  context: 'parameter',
  type: 'function',
  probability: 0.95,
});
```

[Full API Reference →](/api/prior-database)

## Type Definitions

### InferenceResult

Result of type inference.

```typescript
interface InferenceResult {
  /** Identifier name */
  name: string;

  /** Inferred type */
  type: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Confidence interval [low, high] */
  confidenceInterval: [number, number];

  /** Source location */
  location: SourceLocation;

  /** Alternative types considered */
  alternatives: Alternative[];
}
```

[Full Type Reference →](/api/types/inference-result)

### TypeNode

Node in the type lattice.

```typescript
interface TypeNode {
  /** Type name */
  name: string;

  /** Parent types (supertypes) */
  parents: TypeNode[];

  /** Child types (subtypes) */
  children: TypeNode[];

  /** Type metadata */
  metadata: TypeMetadata;
}
```

[Full Type Reference →](/api/types/type-node)

## Examples

### Analyzing a File

```typescript
import { createAnalyzer } from '@ptl/core';

const analyzer = createAnalyzer({
  priors: ['builtin', 'typescript'],
  thresholds: {
    high: 0.85,
    medium: 0.6,
  },
});

const results = await analyzer.analyzeFile('src/index.ts');

console.log(`Average confidence: ${results.averageConfidence}`);
console.log(`Low confidence items: ${results.lowConfidenceCount}`);
```

### Custom Priors

```typescript
import { PriorDatabase } from '@ptl/core';

const customPriors = new PriorDatabase();

// Add naming-based priors
customPriors.addPrior({
  pattern: /^is[A-Z]/,
  context: 'function-return',
  type: 'boolean',
  probability: 0.95,
});

customPriors.addPrior({
  pattern: /count|length|size/i,
  context: 'variable',
  type: 'number',
  probability: 0.9,
});

const inference = new BayesianTypeInference(lattice, customPriors);
```

### Streaming Analysis

```typescript
import { createStreamAnalyzer } from '@ptl/core';

const analyzer = createStreamAnalyzer();

// Process results as they come
analyzer.on('inference', (result) => {
  console.log(`Inferred: ${result.name}: ${result.type}`);
});

analyzer.on('complete', (summary) => {
  console.log(`Done! Average confidence: ${summary.averageConfidence}`);
});

await analyzer.analyze('src/');
```

## Error Handling

```typescript
import { PTLError, ParseError, InferenceError } from '@ptl/core';

try {
  const results = inference.analyzeSource(code);
} catch (error) {
  if (error instanceof ParseError) {
    console.error('Failed to parse:', error.message);
  } else if (error instanceof InferenceError) {
    console.error('Inference failed:', error.message);
  } else {
    throw error;
  }
}
```

## TypeScript Support

PTL is written in TypeScript and provides full type definitions:

```typescript
import type {
  InferenceResult,
  TypeNode,
  ConfidenceInterval,
  AnalyzerOptions,
  PriorDefinition,
} from '@ptl/core';
```
