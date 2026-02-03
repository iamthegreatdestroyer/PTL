# @ptl/core

The core Bayesian type inference engine for PTL (Probabilistic Type Lattice).

## Overview

This package provides the foundational type inference capabilities using Bayesian methods with
Dirichlet priors. Instead of binary pass/fail type checking, PTL infers types with **confidence
intervals**.

## Key Concepts

### Type Lattice

The type lattice represents the hierarchical relationship between types:

```
        ⊤ (unknown/any)
       /|\
      / | \
  string number boolean
     |     |      |
  literal literal literal
      \   |   /
       \  |  /
        ⊥ (never)
```

### Bayesian Inference

Each type belief is represented as a Dirichlet distribution:

```typescript
interface TypeBelief {
  distribution: DirichletDistribution;
  confidence: number; // 0-1
  samples: number;
}
```

### Incremental Updates

The engine supports O(1) incremental updates using dependency tracking.

## Installation

```bash
pnpm add @ptl/core
```

## Usage

```typescript
import { createInferenceEngine, TypeLattice } from '@ptl/core';

// Create the inference engine
const engine = createInferenceEngine({
  priorSource: '@ptl/type-priors/typescript-stdlib',
});

// Analyze TypeScript code
const result = await engine.analyze({
  code: `
    function greet(name) {
      return "Hello, " + name;
    }
  `,
  language: 'typescript',
});

// Get type beliefs with confidence
console.log(result.inferences);
// [
//   {
//     symbol: 'name',
//     type: 'string',
//     confidence: 0.87,
//     interval: { lower: 0.82, upper: 0.92 }
//   },
//   ...
// ]
```

## API Reference

### `createInferenceEngine(options)`

Creates a new PTL inference engine.

### `TypeLattice`

The type lattice data structure for representing type hierarchies.

### `DirichletDistribution`

Bayesian distribution for type beliefs.

### `IncrementalUpdater`

O(1) incremental update handler for code changes.

## License

Dual-licensed under AGPL-3.0-or-later and a commercial license. See [LICENSE](../../LICENSE) for
details.
