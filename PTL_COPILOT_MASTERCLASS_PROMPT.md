# PTL Project Initialization: Autonomous Scaffolding Directive
## Master Prompt for GitHub Copilot Agent Mode

---

## 🎯 MISSION DIRECTIVE

You are the **Lead Architect Agent** for the Probabilistic Type Lattice (PTL) project. You have been granted **MAXIMUM AUTONOMY** to design, scaffold, and implement the complete project infrastructure. Execute with the decisiveness and precision of a senior principal engineer who has built type systems and static analysis tools at scale.

**Repository:** `https://github.com/iamthegreatdestroyer/PTL.git`
**Author:** Stevo (sgbilod / iamthegreatdestroyer)
**License Strategy:** Dual-license (AGPL-3.0 open source + Commercial tiers)

---

## 📋 PROJECT SPECIFICATION

### What PTL Does
Probabilistic Type Lattice is a **Bayesian type inference system** that:
1. Infers types with **confidence intervals** instead of binary pass/fail
2. Maintains type information as **probability distributions** over the type lattice
3. Performs **O(1) incremental updates** when new evidence (code changes) arrives
4. Guides **gradual typing migration** by prioritizing high-uncertainty locations
5. Integrates type information from **multiple sources** (runtime, tests, annotations)
6. Produces **probabilistic error messages** with confidence levels

### Core Innovation: Bayesian Type Inference
Traditional type systems are boolean: either code type-checks or it doesn't. PTL treats types as **beliefs** that can be updated with evidence:

```
P(Type | Evidence) = P(Evidence | Type) × P(Type) / P(Evidence)

Where:
- P(Type) = Prior belief about variable's type (from context)
- P(Evidence | Type) = Likelihood of observing usage given type
- P(Type | Evidence) = Posterior belief (updated type distribution)
- Types form a lattice: ⊥ < specific types < ⊤ (any)
```

### The Problem PTL Solves
**Gradual typing adoption is painful**:
- No guidance on WHERE to add types first
- Type errors are binary (pass/fail) with no nuance
- Can't express "probably a string, but might be null"
- Runtime type information is discarded
- Migration is all-or-nothing

PTL provides:
- **Type confidence scores** for every expression
- **Migration priority lists** (highest uncertainty first)
- **Soft type errors** with probability levels
- **Runtime evidence integration** (strengthen beliefs with observed types)
- **Incremental refinement** (O(1) updates, not O(n) re-analysis)

---

## 🏗️ AUTONOMOUS EXECUTION PROTOCOL

### Phase 1: Repository Structure [EXECUTE IMMEDIATELY]

Create the following monorepo structure using **Turborepo** for build orchestration:

```
PTL/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Continuous integration
│   │   ├── release.yml               # Semantic release automation
│   │   ├── security.yml              # Dependency scanning
│   │   └── benchmark.yml             # Performance regression testing
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── dependabot.yml
│
├── apps/
│   ├── cli/                          # CLI application (Node.js/TypeScript)
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── analyze.ts        # ptl analyze <file> - Analyze types
│   │   │   │   ├── infer.ts          # ptl infer <file> - Infer types
│   │   │   │   ├── migrate.ts        # ptl migrate - Migration guidance
│   │   │   │   ├── check.ts          # ptl check - Probabilistic type check
│   │   │   │   ├── observe.ts        # ptl observe - Record runtime types
│   │   │   │   ├── report.ts         # ptl report - Uncertainty report
│   │   │   │   ├── annotate.ts       # ptl annotate - Auto-add type annotations
│   │   │   │   └── server.ts         # ptl server - LSP server
│   │   │   ├── formatters/
│   │   │   │   ├── terminal.ts       # Rich terminal output
│   │   │   │   ├── json.ts           # JSON output
│   │   │   │   ├── sarif.ts          # SARIF for IDE integration
│   │   │   │   └── typescript.ts     # TypeScript declaration output
│   │   │   ├── reporters/
│   │   │   │   ├── uncertainty-report.ts
│   │   │   │   ├── migration-plan.ts
│   │   │   │   └── confidence-heatmap.ts
│   │   │   └── index.ts              # CLI entry point (Commander.js)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── vscode/                       # VS Code Extension
│   │   ├── src/
│   │   │   ├── extension.ts          # Extension activation
│   │   │   ├── providers/
│   │   │   │   ├── confidence-lens.ts     # CodeLens showing confidence
│   │   │   │   ├── diagnostic-provider.ts # Probabilistic diagnostics
│   │   │   │   ├── hover-provider.ts      # Type distribution on hover
│   │   │   │   ├── completion-provider.ts # Confidence-weighted completion
│   │   │   │   └── inlay-hints.ts         # Inline confidence indicators
│   │   │   ├── commands/
│   │   │   │   ├── show-type-distribution.ts
│   │   │   │   ├── migrate-file.ts
│   │   │   │   ├── add-annotation.ts
│   │   │   │   └── record-runtime.ts
│   │   │   ├── views/
│   │   │   │   ├── uncertainty-tree.ts    # Sidebar tree view
│   │   │   │   ├── lattice-webview.ts     # Type lattice visualization
│   │   │   │   ├── distribution-chart.ts  # Probability distribution chart
│   │   │   │   └── migration-plan.ts      # Migration priority view
│   │   │   ├── decorations/
│   │   │   │   ├── confidence-gutter.ts   # Gutter confidence indicators
│   │   │   │   └── uncertainty-highlight.ts # Highlight uncertain code
│   │   │   └── services/
│   │   │       └── ptl-client.ts          # Communicates with core engine
│   │   ├── media/
│   │   │   ├── icons/
│   │   │   └── styles/
│   │   ├── package.json              # Extension manifest
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── web/                          # Web dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/
│   │   │   │   │   ├── analyze/route.ts
│   │   │   │   │   ├── infer/route.ts
│   │   │   │   │   └── migrate/route.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── components/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── type-lattice-viz/
│   │   │   │   ├── confidence-heatmap/
│   │   │   │   ├── distribution-chart/
│   │   │   │   └── migration-planner/
│   │   │   └── lib/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── runtime-observer/             # Runtime type observation agent
│       ├── src/
│       │   ├── index.ts
│       │   ├── proxy-handler.ts      # Proxy-based type observation
│       │   ├── reporter.ts           # Report observations to PTL
│       │   └── instrumenter.ts       # Code instrumentation
│       ├── package.json
│       └── README.md
│
├── packages/
│   ├── core/                         # Core PTL Engine (TypeScript)
│   │   ├── src/
│   │   │   ├── index.ts              # Public API exports
│   │   │   ├── engine/
│   │   │   │   ├── ptl-engine.ts     # Main orchestration class
│   │   │   │   ├── analyzer.ts       # Code analysis pipeline
│   │   │   │   └── inference.ts      # Type inference coordinator
│   │   │   ├── lattice/
│   │   │   │   ├── type-lattice.ts       # Type lattice structure
│   │   │   │   ├── lattice-node.ts       # Individual type nodes
│   │   │   │   ├── lattice-operations.ts # Meet, join, subtyping
│   │   │   │   ├── builtin-types.ts      # Primitive types
│   │   │   │   └── composite-types.ts    # Object, array, function types
│   │   │   ├── probability/
│   │   │   │   ├── distribution.ts       # Probability distributions
│   │   │   │   ├── dirichlet.ts          # Dirichlet distribution
│   │   │   │   ├── categorical.ts        # Categorical distribution
│   │   │   │   ├── entropy.ts            # Entropy calculations
│   │   │   │   └── confidence.ts         # Confidence interval computation
│   │   │   ├── bayesian/
│   │   │   │   ├── bayesian-inference.ts # Bayesian update engine
│   │   │   │   ├── prior-generator.ts    # Prior probability generation
│   │   │   │   ├── likelihood.ts         # Likelihood computation
│   │   │   │   ├── posterior.ts          # Posterior computation
│   │   │   │   └── evidence.ts           # Evidence types and sources
│   │   │   ├── incremental/
│   │   │   │   ├── incremental-updater.ts # O(1) incremental updates
│   │   │   │   ├── dependency-tracker.ts  # Track type dependencies
│   │   │   │   ├── change-propagator.ts   # Propagate belief changes
│   │   │   │   └── cache.ts               # Inference cache
│   │   │   ├── inference/
│   │   │   │   ├── constraint-generator.ts # Generate type constraints
│   │   │   │   ├── constraint-solver.ts    # Solve constraints probabilistically
│   │   │   │   ├── flow-analysis.ts        # Data flow type inference
│   │   │   │   ├── usage-inference.ts      # Infer from usage patterns
│   │   │   │   └── contextual-typing.ts    # Context-aware inference
│   │   │   ├── migration/
│   │   │   │   ├── migration-planner.ts   # Migration priority calculation
│   │   │   │   ├── uncertainty-ranker.ts  # Rank by uncertainty
│   │   │   │   ├── annotation-generator.ts # Generate type annotations
│   │   │   │   └── impact-analyzer.ts     # Analyze annotation impact
│   │   │   ├── runtime/
│   │   │   │   ├── runtime-observer.ts    # Observe runtime types
│   │   │   │   ├── trace-parser.ts        # Parse runtime traces
│   │   │   │   ├── evidence-integrator.ts # Integrate runtime evidence
│   │   │   │   └── test-analyzer.ts       # Extract types from tests
│   │   │   ├── parser/
│   │   │   │   ├── code-parser.ts         # Abstract parser interface
│   │   │   │   ├── tree-sitter/
│   │   │   │   │   ├── typescript-parser.ts
│   │   │   │   │   ├── javascript-parser.ts
│   │   │   │   │   ├── python-parser.ts
│   │   │   │   │   └── parser-registry.ts
│   │   │   │   └── type-annotation/
│   │   │   │       ├── typescript-annotations.ts
│   │   │   │       ├── jsdoc-annotations.ts
│   │   │   │       └── python-annotations.ts
│   │   │   ├── diagnostics/
│   │   │   │   ├── probabilistic-error.ts # Probabilistic type errors
│   │   │   │   ├── confidence-warning.ts  # Low-confidence warnings
│   │   │   │   └── suggestion-generator.ts # Type suggestion generation
│   │   │   └── types/
│   │   │       ├── type-node.ts           # Type representation
│   │   │       ├── distribution.ts        # Distribution types
│   │   │       ├── evidence.ts            # Evidence types
│   │   │       ├── constraint.ts          # Constraint types
│   │   │       └── config.ts              # Configuration types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── lattice-visualizer/           # Type lattice visualization
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── lattice-renderer.ts   # Render lattice as graph
│   │   │   ├── distribution-chart.ts # Render probability distributions
│   │   │   └── interactive-explorer.ts # Interactive lattice explorer
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── type-priors/                  # Prior probability databases
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── javascript-priors.ts  # Common JS type patterns
│   │   │   ├── typescript-priors.ts  # Common TS patterns
│   │   │   ├── python-priors.ts      # Common Python patterns
│   │   │   ├── api-priors.ts         # Web API type patterns
│   │   │   └── naming-priors.ts      # Type priors from naming conventions
│   │   ├── data/
│   │   │   ├── common-patterns.json
│   │   │   └── naming-conventions.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── shared/                       # Shared types and utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── constants.ts
│   │   │   └── utils/
│   │   │       ├── probability.ts
│   │   │       ├── statistics.ts
│   │   │       └── async.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                       # Shared configs
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   └── base.json
│       └── package.json
│
├── prior-data/                       # Prior probability databases
│   ├── naming-conventions.json       # Type priors from variable names
│   ├── common-patterns.json          # Common type patterns
│   ├── api-signatures.json           # Web API type signatures
│   └── library-types.json            # Popular library types
│
├── docs/
│   ├── architecture.md               # System architecture
│   ├── bayesian-inference.md         # Bayesian type theory
│   ├── type-lattice.md               # Type lattice structure
│   ├── incremental-updates.md        # O(1) update mechanism
│   ├── migration-guide.md            # Gradual typing migration
│   ├── api-reference.md              # API documentation
│   ├── cli-reference.md              # CLI commands
│   ├── vscode-extension.md           # Extension usage
│   └── commercial-licensing.md       # Commercial license info
│
├── scripts/
│   ├── setup.sh                      # Initial setup script
│   ├── generate-priors.ts            # Generate prior databases
│   ├── benchmark.ts                  # Performance benchmarking
│   └── analyze-codebase.ts           # Analyze open source codebases
│
├── examples/
│   ├── basic-inference/
│   ├── migration-workflow/
│   ├── runtime-observation/
│   ├── confidence-thresholds/
│   └── custom-priors/
│
├── test-fixtures/
│   ├── code-samples/
│   │   ├── untyped/                  # Untyped JavaScript
│   │   ├── partially-typed/          # Partial TypeScript
│   │   ├── fully-typed/              # Fully typed reference
│   │   └── python/                   # Python samples
│   ├── expected-distributions/       # Expected type distributions
│   └── migration-scenarios/          # Migration test cases
│
├── benchmarks/
│   ├── datasets/
│   │   ├── real-world/               # Real codebase samples
│   │   └── synthetic/                # Generated test cases
│   ├── results/
│   └── run-benchmarks.ts
│
├── turbo.json                        # Turborepo configuration
├── package.json                      # Root package.json (workspaces)
├── pnpm-workspace.yaml               # PNPM workspace config
├── tsconfig.json                     # Root TypeScript config
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── .gitignore
├── .nvmrc                            # Node version
├── LICENSE                           # AGPL-3.0 license
├── LICENSE-COMMERCIAL.md             # Commercial license terms
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
└── README.md                         # Project overview
```

### Phase 2: Configuration Files [EXECUTE IMMEDIATELY AFTER STRUCTURE]

Generate production-grade configurations:

#### `package.json` (root)
```json
{
  "name": "ptl-monorepo",
  "version": "0.0.0",
  "private": true,
  "description": "Probabilistic Type Lattice - Bayesian type inference with confidence intervals",
  "author": "Stevo <sgbilod@proton.me>",
  "license": "AGPL-3.0-or-later",
  "repository": {
    "type": "git",
    "url": "https://github.com/iamthegreatdestroyer/PTL.git"
  },
  "homepage": "https://github.com/iamthegreatdestroyer/PTL",
  "bugs": {
    "url": "https://github.com/iamthegreatdestroyer/PTL/issues"
  },
  "keywords": [
    "type-inference",
    "bayesian",
    "probabilistic-types",
    "gradual-typing",
    "static-analysis",
    "typescript",
    "type-system",
    "migration",
    "confidence-intervals",
    "type-lattice"
  ],
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "test": "turbo test",
    "test:coverage": "turbo test:coverage",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "prepare": "husky install",
    "release": "changeset publish",
    "version": "changeset version",
    "benchmark": "tsx scripts/benchmark.ts",
    "generate-priors": "tsx scripts/generate-priors.ts"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.56.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.2.0",
    "tsx": "^4.7.0",
    "turbo": "^1.12.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

#### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "*.vsix"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "lint:fix": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

#### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm typecheck

      - name: Test
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/core/coverage/lcov.info
          fail_ci_if_error: false

  benchmark:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm benchmark
      - name: Store benchmark result
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'customSmallerIsBetter'
          output-file-path: benchmarks/results/latest.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true
```

### Phase 3: Core Package Implementation [EXECUTE SYSTEMATICALLY]

#### `packages/core/src/index.ts` - Public API
```typescript
/**
 * PTL - Probabilistic Type Lattice
 * Bayesian type inference with confidence intervals
 * 
 * @packageDocumentation
 * @module @ptl/core
 * @license AGPL-3.0-or-later
 * 
 * Commercial licensing available at https://github.com/iamthegreatdestroyer/PTL
 */

// Main Engine
export { PTLEngine, type PTLEngineConfig } from './engine/ptl-engine';
export { Analyzer } from './engine/analyzer';
export { TypeInference } from './engine/inference';

// Type Lattice
export { TypeLattice } from './lattice/type-lattice';
export { LatticeNode } from './lattice/lattice-node';
export { LatticeOperations } from './lattice/lattice-operations';
export { BuiltinTypes } from './lattice/builtin-types';
export { CompositeTypes } from './lattice/composite-types';

// Probability
export { Distribution } from './probability/distribution';
export { DirichletDistribution } from './probability/dirichlet';
export { CategoricalDistribution } from './probability/categorical';
export { Entropy } from './probability/entropy';
export { Confidence } from './probability/confidence';

// Bayesian Inference
export { BayesianInference } from './bayesian/bayesian-inference';
export { PriorGenerator } from './bayesian/prior-generator';
export { Likelihood } from './bayesian/likelihood';
export { Posterior } from './bayesian/posterior';
export { Evidence, type EvidenceSource } from './bayesian/evidence';

// Incremental Updates
export { IncrementalUpdater } from './incremental/incremental-updater';
export { DependencyTracker } from './incremental/dependency-tracker';
export { ChangePropagator } from './incremental/change-propagator';
export { InferenceCache } from './incremental/cache';

// Type Inference
export { ConstraintGenerator } from './inference/constraint-generator';
export { ConstraintSolver } from './inference/constraint-solver';
export { FlowAnalysis } from './inference/flow-analysis';
export { UsageInference } from './inference/usage-inference';
export { ContextualTyping } from './inference/contextual-typing';

// Migration
export { MigrationPlanner } from './migration/migration-planner';
export { UncertaintyRanker } from './migration/uncertainty-ranker';
export { AnnotationGenerator } from './migration/annotation-generator';
export { ImpactAnalyzer } from './migration/impact-analyzer';

// Runtime
export { RuntimeObserver } from './runtime/runtime-observer';
export { TraceParser } from './runtime/trace-parser';
export { EvidenceIntegrator } from './runtime/evidence-integrator';
export { TestAnalyzer } from './runtime/test-analyzer';

// Diagnostics
export { ProbabilisticError } from './diagnostics/probabilistic-error';
export { ConfidenceWarning } from './diagnostics/confidence-warning';
export { SuggestionGenerator } from './diagnostics/suggestion-generator';

// Types
export type { 
  TypeNode, 
  PrimitiveType,
  ObjectType,
  FunctionType,
  UnionType,
  IntersectionType 
} from './types/type-node';

export type { 
  TypeDistribution,
  ConfidenceInterval,
  ProbabilityMass 
} from './types/distribution';

export type { 
  TypeEvidence,
  RuntimeEvidence,
  AnnotationEvidence,
  UsageEvidence 
} from './types/evidence';

export type { 
  TypeConstraint,
  SubtypeConstraint,
  EqualityConstraint 
} from './types/constraint';

export type { PTLConfig } from './types/config';

// Utilities
export { createPTL } from './factory';
export { version } from './version';
```

#### `packages/core/src/lattice/type-lattice.ts` - Type Lattice Structure
```typescript
/**
 * Type Lattice
 * 
 * A mathematical lattice structure for types where:
 * - ⊥ (bottom) is the uninhabited type (never)
 * - ⊤ (top) is the universal type (unknown/any)
 * - Meet (∧) gives greatest lower bound (intersection)
 * - Join (∨) gives least upper bound (union)
 * 
 * Types are partially ordered by subtyping: A ≤ B iff A is subtype of B
 */

import { LatticeNode, type LatticeNodeType } from './lattice-node';
import { BuiltinTypes } from './builtin-types';
import type { TypeNode } from '../types/type-node';

export interface LatticeConfig {
  /** Include nullable variants of types */
  includeNullable: boolean;
  /** Include undefined variants */
  includeUndefined: boolean;
  /** Maximum depth for recursive types */
  maxRecursionDepth: number;
}

const DEFAULT_CONFIG: LatticeConfig = {
  includeNullable: true,
  includeUndefined: true,
  maxRecursionDepth: 10,
};

export class TypeLattice {
  private readonly config: LatticeConfig;
  private readonly nodes: Map<string, LatticeNode>;
  private readonly edges: Map<string, Set<string>>; // subtype -> supertypes
  private readonly reverseEdges: Map<string, Set<string>>; // supertype -> subtypes
  
  /** Bottom type (never) */
  readonly bottom: LatticeNode;
  /** Top type (unknown) */
  readonly top: LatticeNode;

  constructor(config: Partial<LatticeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.nodes = new Map();
    this.edges = new Map();
    this.reverseEdges = new Map();

    // Initialize with builtin types
    this.bottom = this.createNode('never', 'primitive');
    this.top = this.createNode('unknown', 'primitive');
    
    this.initializeBuiltins();
  }

  /**
   * Initialize builtin primitive types
   */
  private initializeBuiltins(): void {
    const builtins = BuiltinTypes.getAllPrimitives();
    
    for (const type of builtins) {
      const node = this.createNode(type.name, 'primitive');
      
      // All primitives are subtypes of top
      this.addEdge(node, this.top);
      
      // Bottom is subtype of all primitives
      this.addEdge(this.bottom, node);
    }

    // Add subtyping relationships
    // number subtypes: int, float
    // string subtypes: literal strings
    this.establishPrimitiveHierarchy();

    // Add nullable variants if configured
    if (this.config.includeNullable) {
      this.addNullableVariants();
    }
  }

  /**
   * Establish primitive type hierarchy
   */
  private establishPrimitiveHierarchy(): void {
    // number hierarchy
    const number = this.getOrCreate('number', 'primitive');
    const bigint = this.getOrCreate('bigint', 'primitive');
    
    // string hierarchy
    const string = this.getOrCreate('string', 'primitive');
    
    // boolean
    const boolean = this.getOrCreate('boolean', 'primitive');
    const trueLit = this.createNode('true', 'literal');
    const falseLit = this.createNode('false', 'literal');
    this.addEdge(trueLit, boolean);
    this.addEdge(falseLit, boolean);

    // null and undefined
    const nullType = this.getOrCreate('null', 'primitive');
    const undefinedType = this.getOrCreate('undefined', 'primitive');

    // void (undefined | void behavior)
    const voidType = this.getOrCreate('void', 'primitive');
    this.addEdge(undefinedType, voidType);

    // object (non-primitive)
    const object = this.getOrCreate('object', 'primitive');
    
    // function extends object
    const func = this.getOrCreate('function', 'primitive');
    this.addEdge(func, object);

    // array extends object
    const array = this.getOrCreate('Array', 'composite');
    this.addEdge(array, object);
  }

  /**
   * Add nullable variants (T | null)
   */
  private addNullableVariants(): void {
    const nullType = this.getOrCreate('null', 'primitive');
    
    for (const [name, node] of this.nodes) {
      if (name !== 'null' && name !== 'unknown' && name !== 'never') {
        const nullableName = `${name} | null`;
        const nullable = this.createNode(nullableName, 'union');
        
        // Original type is subtype of nullable
        this.addEdge(node, nullable);
        // null is subtype of nullable
        this.addEdge(nullType, nullable);
        // nullable is subtype of top
        this.addEdge(nullable, this.top);
      }
    }
  }

  /**
   * Create a new lattice node
   */
  createNode(name: string, kind: LatticeNodeType): LatticeNode {
    if (this.nodes.has(name)) {
      return this.nodes.get(name)!;
    }

    const node = new LatticeNode(name, kind);
    this.nodes.set(name, node);
    this.edges.set(name, new Set());
    this.reverseEdges.set(name, new Set());
    
    return node;
  }

  /**
   * Get or create a node
   */
  getOrCreate(name: string, kind: LatticeNodeType): LatticeNode {
    return this.nodes.get(name) ?? this.createNode(name, kind);
  }

  /**
   * Get a node by name
   */
  getNode(name: string): LatticeNode | undefined {
    return this.nodes.get(name);
  }

  /**
   * Add subtype edge: a ≤ b (a is subtype of b)
   */
  addEdge(subtype: LatticeNode, supertype: LatticeNode): void {
    this.edges.get(subtype.name)?.add(supertype.name);
    this.reverseEdges.get(supertype.name)?.add(subtype.name);
  }

  /**
   * Check if a is subtype of b: a ≤ b
   */
  isSubtype(a: LatticeNode, b: LatticeNode): boolean {
    if (a.name === b.name) return true;
    if (a.name === 'never') return true; // ⊥ ≤ everything
    if (b.name === 'unknown') return true; // everything ≤ ⊤

    // BFS to find path from a to b
    const visited = new Set<string>();
    const queue = [a.name];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === b.name) return true;
      
      if (visited.has(current)) continue;
      visited.add(current);

      const supertypes = this.edges.get(current);
      if (supertypes) {
        for (const sup of supertypes) {
          queue.push(sup);
        }
      }
    }

    return false;
  }

  /**
   * Meet operation: a ∧ b = greatest lower bound (intersection)
   * 
   * If a ≤ b, meet is a
   * If b ≤ a, meet is b
   * Otherwise, meet might be a new intersection type or ⊥
   */
  meet(a: LatticeNode, b: LatticeNode): LatticeNode {
    if (this.isSubtype(a, b)) return a;
    if (this.isSubtype(b, a)) return b;

    // Find common subtypes and return greatest
    const aSubtypes = this.getAllSubtypes(a);
    const bSubtypes = this.getAllSubtypes(b);
    
    const commonSubtypes = [...aSubtypes].filter(t => bSubtypes.has(t));
    
    if (commonSubtypes.length === 0) {
      return this.bottom; // No common subtype → never
    }

    // Find greatest common subtype
    let greatest = this.bottom;
    for (const typeName of commonSubtypes) {
      const type = this.nodes.get(typeName)!;
      if (this.isSubtype(greatest, type)) {
        greatest = type;
      }
    }

    // If no single greatest exists, create intersection type
    if (greatest === this.bottom && commonSubtypes.length > 1) {
      const intersectionName = `${a.name} & ${b.name}`;
      const intersection = this.getOrCreate(intersectionName, 'intersection');
      this.addEdge(intersection, a);
      this.addEdge(intersection, b);
      return intersection;
    }

    return greatest;
  }

  /**
   * Join operation: a ∨ b = least upper bound (union)
   * 
   * If a ≤ b, join is b
   * If b ≤ a, join is a
   * Otherwise, join is their union type
   */
  join(a: LatticeNode, b: LatticeNode): LatticeNode {
    if (this.isSubtype(a, b)) return b;
    if (this.isSubtype(b, a)) return a;

    // Find common supertypes and return least
    const aSupertypes = this.getAllSupertypes(a);
    const bSupertypes = this.getAllSupertypes(b);
    
    const commonSupertypes = [...aSupertypes].filter(t => bSupertypes.has(t));
    
    if (commonSupertypes.length === 0) {
      return this.top; // No common supertype → unknown
    }

    // Find least common supertype
    let least = this.top;
    for (const typeName of commonSupertypes) {
      const type = this.nodes.get(typeName)!;
      if (this.isSubtype(type, least)) {
        least = type;
      }
    }

    // If no single least exists, create union type
    if (least === this.top) {
      const unionName = `${a.name} | ${b.name}`;
      const union = this.getOrCreate(unionName, 'union');
      this.addEdge(a, union);
      this.addEdge(b, union);
      this.addEdge(union, this.top);
      return union;
    }

    return least;
  }

  /**
   * Get all subtypes of a node (transitive)
   */
  getAllSubtypes(node: LatticeNode): Set<string> {
    const subtypes = new Set<string>();
    const queue = [node.name];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = this.reverseEdges.get(current);
      
      if (children) {
        for (const child of children) {
          if (!subtypes.has(child)) {
            subtypes.add(child);
            queue.push(child);
          }
        }
      }
    }

    return subtypes;
  }

  /**
   * Get all supertypes of a node (transitive)
   */
  getAllSupertypes(node: LatticeNode): Set<string> {
    const supertypes = new Set<string>();
    const queue = [node.name];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const parents = this.edges.get(current);
      
      if (parents) {
        for (const parent of parents) {
          if (!supertypes.has(parent)) {
            supertypes.add(parent);
            queue.push(parent);
          }
        }
      }
    }

    return supertypes;
  }

  /**
   * Get direct supertypes (parents)
   */
  getDirectSupertypes(node: LatticeNode): LatticeNode[] {
    const parents = this.edges.get(node.name);
    if (!parents) return [];
    return [...parents].map(name => this.nodes.get(name)!).filter(Boolean);
  }

  /**
   * Get direct subtypes (children)
   */
  getDirectSubtypes(node: LatticeNode): LatticeNode[] {
    const children = this.reverseEdges.get(node.name);
    if (!children) return [];
    return [...children].map(name => this.nodes.get(name)!).filter(Boolean);
  }

  /**
   * Get all nodes in the lattice
   */
  getAllNodes(): LatticeNode[] {
    return [...this.nodes.values()];
  }

  /**
   * Export lattice as JSON for visualization
   */
  toJSON(): { nodes: object[]; edges: object[] } {
    const nodes = this.getAllNodes().map(n => ({
      id: n.name,
      kind: n.kind,
    }));

    const edges: object[] = [];
    for (const [from, toSet] of this.edges) {
      for (const to of toSet) {
        edges.push({ from, to });
      }
    }

    return { nodes, edges };
  }
}
```

#### `packages/core/src/bayesian/bayesian-inference.ts` - Bayesian Type Inference
```typescript
/**
 * Bayesian Type Inference
 * 
 * Implements Bayesian updating for type beliefs:
 * 
 * P(Type | Evidence) ∝ P(Evidence | Type) × P(Type)
 * 
 * Where:
 * - P(Type) is the prior belief (from context, naming, etc.)
 * - P(Evidence | Type) is the likelihood (how likely is this usage given type)
 * - P(Type | Evidence) is the posterior (updated belief after seeing evidence)
 */

import { TypeLattice } from '../lattice/type-lattice';
import { LatticeNode } from '../lattice/lattice-node';
import { Distribution } from '../probability/distribution';
import { DirichletDistribution } from '../probability/dirichlet';
import { PriorGenerator } from './prior-generator';
import { Likelihood } from './likelihood';
import { Evidence, type EvidenceSource } from './evidence';
import type { TypeDistribution, ConfidenceInterval } from '../types/distribution';

export interface BayesianConfig {
  /** Minimum probability mass to retain a type */
  pruneThreshold: number;
  /** Prior strength (pseudo-count for Dirichlet) */
  priorStrength: number;
  /** Enable conjugate prior updates */
  useConjugatePriors: boolean;
  /** Maximum types to track per variable */
  maxTypesTracked: number;
}

const DEFAULT_CONFIG: BayesianConfig = {
  pruneThreshold: 0.001,
  priorStrength: 1.0,
  useConjugatePriors: true,
  maxTypesTracked: 50,
};

export interface TypeBelief {
  /** The type */
  type: LatticeNode;
  /** Probability mass */
  probability: number;
  /** Evidence count supporting this type */
  evidenceCount: number;
}

export interface InferenceResult {
  /** Distribution over possible types */
  distribution: TypeDistribution;
  /** Most likely type */
  mostLikely: LatticeNode;
  /** Confidence in most likely type */
  confidence: number;
  /** Confidence interval */
  confidenceInterval: ConfidenceInterval;
  /** Entropy of distribution (uncertainty measure) */
  entropy: number;
  /** Evidence sources used */
  evidenceSources: EvidenceSource[];
}

export class BayesianInference {
  private readonly config: BayesianConfig;
  private readonly lattice: TypeLattice;
  private readonly priorGenerator: PriorGenerator;
  private readonly likelihood: Likelihood;
  
  /** Current beliefs for each variable */
  private beliefs: Map<string, DirichletDistribution>;

  constructor(
    lattice: TypeLattice,
    config: Partial<BayesianConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lattice = lattice;
    this.priorGenerator = new PriorGenerator(lattice);
    this.likelihood = new Likelihood(lattice);
    this.beliefs = new Map();
  }

  /**
   * Initialize belief for a new variable
   */
  initializeBelief(
    variableName: string,
    context: VariableContext
  ): DirichletDistribution {
    // Generate prior from context
    const prior = this.priorGenerator.generate(variableName, context);
    
    // Create Dirichlet distribution as conjugate prior for categorical
    const types = prior.types;
    const alphas = prior.probabilities.map(
      p => p * this.config.priorStrength + 1
    );

    const distribution = new DirichletDistribution(types, alphas);
    this.beliefs.set(variableName, distribution);
    
    return distribution;
  }

  /**
   * Update belief with new evidence using Bayes' rule
   * 
   * For conjugate Dirichlet-Categorical:
   * α_posterior = α_prior + counts
   */
  update(
    variableName: string,
    evidence: Evidence
  ): InferenceResult {
    let belief = this.beliefs.get(variableName);
    
    if (!belief) {
      // Initialize with uniform prior if not exists
      belief = this.initializeBelief(variableName, {
        name: variableName,
        scope: 'unknown',
      });
    }

    // Compute likelihood P(evidence | type) for each type
    const likelihoods = this.likelihood.compute(evidence, belief.types);

    if (this.config.useConjugatePriors) {
      // Conjugate update: add evidence counts to Dirichlet parameters
      belief = this.conjugateUpdate(belief, evidence, likelihoods);
    } else {
      // Full Bayesian update
      belief = this.fullBayesianUpdate(belief, likelihoods);
    }

    // Prune low-probability types
    belief = this.prune(belief);
    
    this.beliefs.set(variableName, belief);

    return this.computeResult(belief, evidence);
  }

  /**
   * Conjugate Dirichlet update
   * 
   * If we observe type T with count c:
   * α_T_new = α_T_old + c
   */
  private conjugateUpdate(
    prior: DirichletDistribution,
    evidence: Evidence,
    likelihoods: Map<LatticeNode, number>
  ): DirichletDistribution {
    const newAlphas = [...prior.alphas];

    // For each type, add weighted evidence count
    for (let i = 0; i < prior.types.length; i++) {
      const type = prior.types[i];
      const likelihood = likelihoods.get(type) ?? 0;
      
      // Weight evidence by likelihood
      newAlphas[i] += evidence.strength * likelihood;
    }

    return new DirichletDistribution(prior.types, newAlphas);
  }

  /**
   * Full Bayesian update (non-conjugate)
   * 
   * P(type | evidence) = P(evidence | type) × P(type) / P(evidence)
   */
  private fullBayesianUpdate(
    prior: DirichletDistribution,
    likelihoods: Map<LatticeNode, number>
  ): DirichletDistribution {
    const priorProbs = prior.mean();
    const posteriorUnnormalized: number[] = [];

    // Compute unnormalized posterior
    for (let i = 0; i < prior.types.length; i++) {
      const type = prior.types[i];
      const priorP = priorProbs[i];
      const likelihood = likelihoods.get(type) ?? 0;
      posteriorUnnormalized.push(priorP * likelihood);
    }

    // Normalize
    const evidence = posteriorUnnormalized.reduce((a, b) => a + b, 0);
    const posteriorProbs = posteriorUnnormalized.map(p => p / evidence);

    // Convert back to Dirichlet (moment matching)
    const totalAlpha = prior.alphas.reduce((a, b) => a + b, 0);
    const newAlphas = posteriorProbs.map(p => p * totalAlpha);

    return new DirichletDistribution(prior.types, newAlphas);
  }

  /**
   * Prune low-probability types
   */
  private prune(distribution: DirichletDistribution): DirichletDistribution {
    const probs = distribution.mean();
    const keepIndices: number[] = [];

    for (let i = 0; i < probs.length; i++) {
      if (probs[i] >= this.config.pruneThreshold) {
        keepIndices.push(i);
      }
    }

    // Keep at least top-k types
    if (keepIndices.length === 0) {
      const sorted = probs
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p - a.p);
      keepIndices.push(...sorted.slice(0, 3).map(x => x.i));
    }

    // Limit to max types
    if (keepIndices.length > this.config.maxTypesTracked) {
      const sorted = keepIndices
        .map(i => ({ p: probs[i], i }))
        .sort((a, b) => b.p - a.p);
      keepIndices.length = 0;
      keepIndices.push(...sorted.slice(0, this.config.maxTypesTracked).map(x => x.i));
    }

    const newTypes = keepIndices.map(i => distribution.types[i]);
    const newAlphas = keepIndices.map(i => distribution.alphas[i]);

    return new DirichletDistribution(newTypes, newAlphas);
  }

  /**
   * Compute inference result from distribution
   */
  private computeResult(
    distribution: DirichletDistribution,
    evidence: Evidence
  ): InferenceResult {
    const probs = distribution.mean();
    
    // Find most likely type
    let maxProb = 0;
    let maxIndex = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIndex = i;
      }
    }

    const mostLikely = distribution.types[maxIndex];
    
    // Compute confidence interval using Dirichlet variance
    const variance = distribution.variance();
    const ci = this.computeConfidenceInterval(probs[maxIndex], variance[maxIndex]);

    // Compute entropy
    const entropy = this.computeEntropy(probs);

    return {
      distribution: {
        types: distribution.types,
        probabilities: probs,
      },
      mostLikely,
      confidence: maxProb,
      confidenceInterval: ci,
      entropy,
      evidenceSources: [evidence.source],
    };
  }

  /**
   * Compute confidence interval from variance
   */
  private computeConfidenceInterval(
    mean: number,
    variance: number
  ): ConfidenceInterval {
    const std = Math.sqrt(variance);
    const z = 1.96; // 95% CI

    return {
      lower: Math.max(0, mean - z * std),
      upper: Math.min(1, mean + z * std),
      level: 0.95,
    };
  }

  /**
   * Compute Shannon entropy of distribution
   * 
   * H = -Σ p(x) log p(x)
   * 
   * Higher entropy = more uncertainty
   */
  private computeEntropy(probs: number[]): number {
    let entropy = 0;
    
    for (const p of probs) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    return entropy;
  }

  /**
   * Get current belief for a variable
   */
  getBelief(variableName: string): DirichletDistribution | undefined {
    return this.beliefs.get(variableName);
  }

  /**
   * Get most likely type for a variable
   */
  getMostLikelyType(variableName: string): LatticeNode | undefined {
    const belief = this.beliefs.get(variableName);
    if (!belief) return undefined;

    const probs = belief.mean();
    let maxProb = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxProb) {
        maxProb = probs[i];
        maxIndex = i;
      }
    }

    return belief.types[maxIndex];
  }

  /**
   * Get uncertainty (entropy) for a variable
   */
  getUncertainty(variableName: string): number {
    const belief = this.beliefs.get(variableName);
    if (!belief) return Infinity;

    return this.computeEntropy(belief.mean());
  }

  /**
   * Check if type is compatible with belief
   */
  isCompatible(
    variableName: string,
    type: LatticeNode,
    threshold: number = 0.05
  ): { compatible: boolean; probability: number } {
    const belief = this.beliefs.get(variableName);
    if (!belief) {
      return { compatible: true, probability: 1 }; // No info, assume compatible
    }

    // Find probability of type or its supertypes
    let totalProb = 0;
    for (let i = 0; i < belief.types.length; i++) {
      if (this.lattice.isSubtype(belief.types[i], type) ||
          this.lattice.isSubtype(type, belief.types[i])) {
        totalProb += belief.mean()[i];
      }
    }

    return {
      compatible: totalProb >= threshold,
      probability: totalProb,
    };
  }

  /**
   * Merge evidence from multiple sources
   */
  mergeEvidence(
    variableName: string,
    evidences: Evidence[]
  ): InferenceResult {
    let result: InferenceResult | undefined;

    for (const evidence of evidences) {
      result = this.update(variableName, evidence);
    }

    return result!;
  }

  /**
   * Export all beliefs for serialization
   */
  exportBeliefs(): Map<string, object> {
    const exported = new Map<string, object>();
    
    for (const [name, belief] of this.beliefs) {
      exported.set(name, {
        types: belief.types.map(t => t.name),
        alphas: belief.alphas,
      });
    }
    
    return exported;
  }

  /**
   * Import beliefs from serialized data
   */
  importBeliefs(data: Map<string, object>): void {
    for (const [name, obj] of data) {
      const { types, alphas } = obj as { types: string[]; alphas: number[] };
      const typeNodes = types.map(t => this.lattice.getOrCreate(t, 'primitive'));
      this.beliefs.set(name, new DirichletDistribution(typeNodes, alphas));
    }
  }
}

export interface VariableContext {
  name: string;
  scope: string;
  functionName?: string;
  className?: string;
  parameterOf?: string;
  returnOf?: string;
}
```

#### `packages/core/src/incremental/incremental-updater.ts` - O(1) Incremental Updates
```typescript
/**
 * Incremental Updater
 * 
 * Enables O(1) updates to type beliefs when code changes,
 * instead of O(n) full re-analysis.
 * 
 * Key insight: Type beliefs form a dependency graph. When a variable's
 * belief changes, we only need to update variables that depend on it.
 * 
 * Uses belief propagation to efficiently update dependent beliefs.
 */

import { BayesianInference, type InferenceResult } from '../bayesian/bayesian-inference';
import { DependencyTracker, type Dependency } from './dependency-tracker';
import { ChangePropagator } from './change-propagator';
import { InferenceCache } from './cache';
import type { Evidence } from '../bayesian/evidence';

export interface UpdateConfig {
  /** Maximum propagation depth */
  maxPropagationDepth: number;
  /** Minimum change to trigger propagation */
  propagationThreshold: number;
  /** Enable lazy propagation */
  lazyPropagation: boolean;
  /** Cache size limit */
  cacheSize: number;
}

const DEFAULT_CONFIG: UpdateConfig = {
  maxPropagationDepth: 10,
  propagationThreshold: 0.01,
  lazyPropagation: true,
  cacheSize: 10000,
};

export interface UpdateResult {
  /** Variables that were updated */
  updatedVariables: string[];
  /** New inference results */
  results: Map<string, InferenceResult>;
  /** Propagation depth reached */
  propagationDepth: number;
  /** Time taken (ms) */
  timeTaken: number;
}

export class IncrementalUpdater {
  private readonly config: UpdateConfig;
  private readonly inference: BayesianInference;
  private readonly dependencies: DependencyTracker;
  private readonly propagator: ChangePropagator;
  private readonly cache: InferenceCache;
  
  /** Pending updates for lazy propagation */
  private pendingUpdates: Map<string, Evidence[]>;
  /** Version counter for cache invalidation */
  private version: number = 0;

  constructor(
    inference: BayesianInference,
    config: Partial<UpdateConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.inference = inference;
    this.dependencies = new DependencyTracker();
    this.propagator = new ChangePropagator(this.config.propagationThreshold);
    this.cache = new InferenceCache(this.config.cacheSize);
    this.pendingUpdates = new Map();
  }

  /**
   * Update a single variable with new evidence (O(1) for local update)
   */
  update(variableName: string, evidence: Evidence): UpdateResult {
    const startTime = performance.now();
    const updatedVariables: string[] = [];
    const results = new Map<string, InferenceResult>();

    // Get old belief for change detection
    const oldBelief = this.inference.getBelief(variableName);
    const oldProbs = oldBelief?.mean() ?? [];

    // Perform local update
    const result = this.inference.update(variableName, evidence);
    updatedVariables.push(variableName);
    results.set(variableName, result);

    // Invalidate cache
    this.cache.invalidate(variableName);
    this.version++;

    // Calculate belief change magnitude
    const newProbs = result.distribution.probabilities;
    const changeMagnitude = this.calculateChangeMagnitude(oldProbs, newProbs);

    let propagationDepth = 0;

    // Propagate if change is significant
    if (changeMagnitude >= this.config.propagationThreshold) {
      if (this.config.lazyPropagation) {
        // Queue for lazy propagation
        this.queuePropagation(variableName, evidence);
      } else {
        // Immediate propagation
        const propagated = this.propagateChange(
          variableName,
          result,
          0
        );
        
        for (const [name, propResult] of propagated.entries()) {
          updatedVariables.push(name);
          results.set(name, propResult);
        }
        
        propagationDepth = this.calculateDepth(propagated.keys());
      }
    }

    return {
      updatedVariables,
      results,
      propagationDepth,
      timeTaken: performance.now() - startTime,
    };
  }

  /**
   * Batch update multiple variables
   */
  batchUpdate(updates: Array<{ variable: string; evidence: Evidence }>): UpdateResult {
    const startTime = performance.now();
    const updatedVariables: string[] = [];
    const results = new Map<string, InferenceResult>();
    
    // Perform all local updates first
    for (const { variable, evidence } of updates) {
      const result = this.inference.update(variable, evidence);
      updatedVariables.push(variable);
      results.set(variable, result);
      this.cache.invalidate(variable);
    }

    this.version++;

    // Single propagation pass for all changes
    if (!this.config.lazyPropagation) {
      const allPropagated = new Map<string, InferenceResult>();
      
      for (const variable of updatedVariables) {
        const result = results.get(variable)!;
        const propagated = this.propagateChange(variable, result, 0);
        
        for (const [name, propResult] of propagated.entries()) {
          if (!allPropagated.has(name)) {
            allPropagated.set(name, propResult);
          }
        }
      }
      
      for (const [name, result] of allPropagated.entries()) {
        if (!updatedVariables.includes(name)) {
          updatedVariables.push(name);
          results.set(name, result);
        }
      }
    }

    return {
      updatedVariables,
      results,
      propagationDepth: this.calculateDepth(results.keys()),
      timeTaken: performance.now() - startTime,
    };
  }

  /**
   * Propagate belief change to dependent variables
   */
  private propagateChange(
    sourceVariable: string,
    sourceResult: InferenceResult,
    currentDepth: number
  ): Map<string, InferenceResult> {
    const propagated = new Map<string, InferenceResult>();

    if (currentDepth >= this.config.maxPropagationDepth) {
      return propagated;
    }

    // Get variables that depend on source
    const dependents = this.dependencies.getDependents(sourceVariable);

    for (const dependent of dependents) {
      // Create derived evidence from source's new belief
      const derivedEvidence = this.propagator.createDerivedEvidence(
        sourceVariable,
        sourceResult,
        dependent
      );

      // Update dependent
      const result = this.inference.update(dependent.variable, derivedEvidence);
      propagated.set(dependent.variable, result);

      // Recurse if change is significant
      const oldBelief = this.cache.get(dependent.variable);
      if (oldBelief) {
        const changeMagnitude = this.calculateChangeMagnitude(
          oldBelief.distribution.probabilities,
          result.distribution.probabilities
        );

        if (changeMagnitude >= this.config.propagationThreshold) {
          const subPropagated = this.propagateChange(
            dependent.variable,
            result,
            currentDepth + 1
          );
          
          for (const [name, subResult] of subPropagated.entries()) {
            propagated.set(name, subResult);
          }
        }
      }

      // Update cache
      this.cache.set(dependent.variable, result);
    }

    return propagated;
  }

  /**
   * Queue update for lazy propagation
   */
  private queuePropagation(variableName: string, evidence: Evidence): void {
    const existing = this.pendingUpdates.get(variableName) ?? [];
    existing.push(evidence);
    this.pendingUpdates.set(variableName, existing);
  }

  /**
   * Flush pending lazy propagations
   */
  flushPendingUpdates(): UpdateResult {
    const startTime = performance.now();
    const updatedVariables: string[] = [];
    const results = new Map<string, InferenceResult>();

    for (const [variable, evidences] of this.pendingUpdates.entries()) {
      for (const evidence of evidences) {
        const result = this.inference.update(variable, evidence);
        
        if (!updatedVariables.includes(variable)) {
          updatedVariables.push(variable);
        }
        results.set(variable, result);

        // Now propagate
        const propagated = this.propagateChange(variable, result, 0);
        for (const [name, propResult] of propagated.entries()) {
          if (!updatedVariables.includes(name)) {
            updatedVariables.push(name);
          }
          results.set(name, propResult);
        }
      }
    }

    this.pendingUpdates.clear();

    return {
      updatedVariables,
      results,
      propagationDepth: this.calculateDepth(results.keys()),
      timeTaken: performance.now() - startTime,
    };
  }

  /**
   * Register a type dependency
   */
  registerDependency(
    fromVariable: string,
    toVariable: string,
    kind: Dependency['kind']
  ): void {
    this.dependencies.addDependency({
      variable: toVariable,
      dependsOn: fromVariable,
      kind,
    });
  }

  /**
   * Calculate magnitude of belief change (KL divergence approximation)
   */
  private calculateChangeMagnitude(
    oldProbs: number[],
    newProbs: number[]
  ): number {
    if (oldProbs.length === 0) return 1; // New belief, max change

    // Simplified KL divergence
    let divergence = 0;
    const minLength = Math.min(oldProbs.length, newProbs.length);
    
    for (let i = 0; i < minLength; i++) {
      const p = Math.max(newProbs[i], 1e-10);
      const q = Math.max(oldProbs[i], 1e-10);
      divergence += p * Math.log(p / q);
    }

    return Math.abs(divergence);
  }

  /**
   * Calculate max depth of propagation
   */
  private calculateDepth(variables: IterableIterator<string>): number {
    let maxDepth = 0;
    
    for (const variable of variables) {
      const depth = this.dependencies.getDepth(variable);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth;
  }

  /**
   * Get cached result if valid
   */
  getCached(variableName: string): InferenceResult | undefined {
    return this.cache.get(variableName);
  }

  /**
   * Get current version (for cache invalidation checks)
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.cache.clear();
    this.pendingUpdates.clear();
    this.version = 0;
  }
}
```

### Phase 4: CLI Application [EXECUTE AFTER CORE]

#### `apps/cli/src/index.ts`
```typescript
#!/usr/bin/env node
/**
 * PTL CLI - Probabilistic Type Lattice Command Line Interface
 * 
 * @license AGPL-3.0-or-later
 */

import { Command } from 'commander';
import { version } from '@ptl/core';
import { analyzeCommand } from './commands/analyze';
import { inferCommand } from './commands/infer';
import { migrateCommand } from './commands/migrate';
import { checkCommand } from './commands/check';
import { observeCommand } from './commands/observe';
import { reportCommand } from './commands/report';
import { annotateCommand } from './commands/annotate';
import { serverCommand } from './commands/server';

const program = new Command();

program
  .name('ptl')
  .description('Probabilistic Type Lattice - Bayesian type inference with confidence')
  .version(version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--no-color', 'Disable colored output')
  .option('--json', 'Output in JSON format');

program.addCommand(analyzeCommand);
program.addCommand(inferCommand);
program.addCommand(migrateCommand);
program.addCommand(checkCommand);
program.addCommand(observeCommand);
program.addCommand(reportCommand);
program.addCommand(annotateCommand);
program.addCommand(serverCommand);

program.parse();
```

#### `apps/cli/src/commands/infer.ts`
```typescript
/**
 * Infer command - Infer types with confidence intervals
 */

import { Command } from 'commander';
import { PTLEngine, type InferenceResult } from '@ptl/core';
import ora from 'ora';
import chalk from 'chalk';

export const inferCommand = new Command('infer')
  .description('Infer types with probability distributions')
  .argument('<file>', 'Source file to analyze')
  .option('-f, --function <name>', 'Analyze specific function')
  .option('-v, --variable <name>', 'Analyze specific variable')
  .option('--min-confidence <n>', 'Minimum confidence to report', '0.5')
  .option('--show-distribution', 'Show full probability distribution')
  .option('--include-runtime', 'Include runtime evidence if available')
  .option('--output <format>', 'Output format (terminal|json|typescript)', 'terminal')
  .action(async (file: string, options) => {
    const spinner = ora('Initializing PTL engine...').start();
    
    try {
      const engine = await PTLEngine.create({
        includeRuntime: options.includeRuntime,
      });

      spinner.text = `Parsing ${file}...`;
      const parsed = await engine.parseFile(file);

      spinner.text = `Inferring types for ${parsed.variables.length} variables...`;
      const results = await engine.infer(parsed, {
        functionName: options.function,
        variableName: options.variable,
      });

      spinner.succeed(`Inferred types for ${results.size} variables`);

      // Filter by confidence
      const minConfidence = parseFloat(options.minConfidence);
      const filtered = new Map<string, InferenceResult>();
      
      for (const [name, result] of results) {
        if (result.confidence >= minConfidence) {
          filtered.set(name, result);
        }
      }

      // Output results
      if (options.output === 'json') {
        outputJSON(filtered);
      } else if (options.output === 'typescript') {
        outputTypeScript(filtered);
      } else {
        outputTerminal(filtered, options.showDistribution);
      }

    } catch (error) {
      spinner.fail('Inference failed');
      console.error(chalk.red(error instanceof Error ? error.message : error));
      process.exit(1);
    }
  });

function outputTerminal(
  results: Map<string, InferenceResult>,
  showDistribution: boolean
): void {
  console.log(chalk.bold('\n🔮 Type Inference Results\n'));

  // Sort by confidence (ascending = most uncertain first)
  const sorted = [...results.entries()].sort(
    (a, b) => a[1].confidence - b[1].confidence
  );

  for (const [name, result] of sorted) {
    const confidenceBar = getConfidenceBar(result.confidence);
    const confidenceColor = getConfidenceColor(result.confidence);
    
    console.log(
      `${chalk.cyan(name)}: ${chalk.bold(result.mostLikely.name)} ` +
      `${confidenceColor(`(${(result.confidence * 100).toFixed(1)}%)`)} ` +
      confidenceBar
    );

    // Show confidence interval
    const ci = result.confidenceInterval;
    console.log(
      chalk.gray(`  95% CI: [${(ci.lower * 100).toFixed(1)}%, ${(ci.upper * 100).toFixed(1)}%]`)
    );

    // Show entropy (uncertainty)
    const entropyIcon = result.entropy > 2 ? '⚠️' : result.entropy > 1 ? '🔶' : '✅';
    console.log(
      chalk.gray(`  Entropy: ${result.entropy.toFixed(2)} bits ${entropyIcon}`)
    );

    // Show full distribution if requested
    if (showDistribution) {
      console.log(chalk.gray('  Distribution:'));
      const dist = result.distribution;
      
      for (let i = 0; i < Math.min(dist.types.length, 5); i++) {
        const prob = dist.probabilities[i];
        const bar = '█'.repeat(Math.round(prob * 20));
        console.log(
          chalk.gray(`    ${dist.types[i].name.padEnd(15)} ${bar} ${(prob * 100).toFixed(1)}%`)
        );
      }
      
      if (dist.types.length > 5) {
        console.log(chalk.gray(`    ... and ${dist.types.length - 5} more`));
      }
    }

    console.log();
  }

  // Summary
  const avgConfidence = [...results.values()]
    .reduce((sum, r) => sum + r.confidence, 0) / results.size;
  const avgEntropy = [...results.values()]
    .reduce((sum, r) => sum + r.entropy, 0) / results.size;
  const highUncertainty = [...results.values()]
    .filter(r => r.entropy > 2).length;

  console.log(chalk.bold('📊 Summary'));
  console.log(`  Variables analyzed: ${results.size}`);
  console.log(`  Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`  Average entropy: ${avgEntropy.toFixed(2)} bits`);
  
  if (highUncertainty > 0) {
    console.log(chalk.yellow(`  ⚠️  High uncertainty: ${highUncertainty} variables`));
  }
}

function outputJSON(results: Map<string, InferenceResult>): void {
  const output: Record<string, object> = {};
  
  for (const [name, result] of results) {
    output[name] = {
      type: result.mostLikely.name,
      confidence: result.confidence,
      confidenceInterval: result.confidenceInterval,
      entropy: result.entropy,
      distribution: {
        types: result.distribution.types.map(t => t.name),
        probabilities: result.distribution.probabilities,
      },
    };
  }
  
  console.log(JSON.stringify(output, null, 2));
}

function outputTypeScript(results: Map<string, InferenceResult>): void {
  console.log('// Generated by PTL - Probabilistic Type Lattice\n');
  
  for (const [name, result] of results) {
    const confidence = (result.confidence * 100).toFixed(0);
    console.log(`// Confidence: ${confidence}%`);
    console.log(`declare const ${name}: ${result.mostLikely.name};`);
    console.log();
  }
}

function getConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 10);
  const empty = 10 - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function getConfidenceColor(confidence: number): (text: string) => string {
  if (confidence >= 0.9) return chalk.green;
  if (confidence >= 0.7) return chalk.yellow;
  if (confidence >= 0.5) return chalk.magenta;
  return chalk.red;
}
```

### Phase 5: VS Code Extension [EXECUTE AFTER CLI]

#### `apps/vscode/package.json`
```json
{
  "name": "ptl-vscode",
  "displayName": "PTL - Probabilistic Type Inference",
  "description": "Bayesian type inference with confidence intervals for gradual typing",
  "version": "0.0.1",
  "publisher": "iamthegreatdestroyer",
  "repository": {
    "type": "git",
    "url": "https://github.com/iamthegreatdestroyer/PTL.git"
  },
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Programming Languages",
    "Linters",
    "Other"
  ],
  "activationEvents": [
    "onLanguage:typescript",
    "onLanguage:javascript",
    "onLanguage:python"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "ptl.analyzeFile",
        "title": "PTL: Analyze File"
      },
      {
        "command": "ptl.showTypeDistribution",
        "title": "PTL: Show Type Distribution"
      },
      {
        "command": "ptl.generateMigrationPlan",
        "title": "PTL: Generate Migration Plan"
      },
      {
        "command": "ptl.addTypeAnnotation",
        "title": "PTL: Add Type Annotation"
      },
      {
        "command": "ptl.showTypeLattice",
        "title": "PTL: Show Type Lattice"
      },
      {
        "command": "ptl.recordRuntime",
        "title": "PTL: Record Runtime Types"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "ptlUncertainty",
          "name": "Type Uncertainty"
        }
      ]
    },
    "configuration": {
      "title": "PTL",
      "properties": {
        "ptl.showConfidenceLens": {
          "type": "boolean",
          "default": true,
          "description": "Show type confidence as CodeLens"
        },
        "ptl.showInlayHints": {
          "type": "boolean",
          "default": true,
          "description": "Show inferred types as inlay hints"
        },
        "ptl.confidenceThreshold": {
          "type": "number",
          "default": 0.5,
          "minimum": 0,
          "maximum": 1,
          "description": "Minimum confidence to show inferred type"
        },
        "ptl.highlightUncertain": {
          "type": "boolean",
          "default": true,
          "description": "Highlight variables with high uncertainty"
        },
        "ptl.uncertaintyThreshold": {
          "type": "number",
          "default": 2.0,
          "description": "Entropy threshold for uncertainty highlight"
        },
        "ptl.autoAnalyze": {
          "type": "boolean",
          "default": true,
          "description": "Automatically analyze on file save"
        }
      }
    },
    "colors": [
      {
        "id": "ptl.highConfidence",
        "description": "Color for high confidence types",
        "defaults": { "dark": "#4caf50", "light": "#2e7d32" }
      },
      {
        "id": "ptl.mediumConfidence",
        "description": "Color for medium confidence types",
        "defaults": { "dark": "#ff9800", "light": "#ef6c00" }
      },
      {
        "id": "ptl.lowConfidence",
        "description": "Color for low confidence types",
        "defaults": { "dark": "#f44336", "light": "#c62828" }
      },
      {
        "id": "ptl.uncertainBackground",
        "description": "Background for uncertain code",
        "defaults": { "dark": "#ff980020", "light": "#ff980010" }
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "pnpm run build",
    "build": "esbuild ./src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
    "watch": "pnpm run build --watch",
    "package": "vsce package --no-dependencies",
    "publish": "vsce publish --no-dependencies"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@vscode/vsce": "^2.22.0",
    "esbuild": "^0.19.0"
  },
  "dependencies": {
    "@ptl/core": "workspace:*"
  }
}
```

---

## 🚀 EXECUTION INSTRUCTIONS

### IMMEDIATE ACTIONS (Execute in Order):

1. **Clone & Initialize**
   ```bash
   git clone https://github.com/iamthegreatdestroyer/PTL.git
   cd PTL
   pnpm install
   ```

2. **Create Complete Directory Structure**
   Generate all directories and placeholder files as specified above.

3. **Generate All Configuration Files**
   Create every config file with production-ready settings.

4. **Implement Core PTL Engine**
   Build out `packages/core` with:
   - Type lattice
   - Bayesian inference
   - Incremental updates
   - Migration planner

5. **Build CLI Application**
   Implement all commands in `apps/cli`.

6. **Create VS Code Extension**
   Set up extension structure in `apps/vscode`.

7. **Build Prior Database**
   Populate `packages/type-priors` with common patterns.

8. **Create Runtime Observer**
   Implement runtime type observation in `apps/runtime-observer`.

9. **Write Comprehensive Tests**
   Create test suites with known type inference scenarios.

10. **Generate Documentation**
    Write all markdown documentation files.

### AUTONOMY PARAMETERS

- **DO NOT** ask for confirmation on standard architectural decisions
- **DO** use TypeScript strict mode throughout
- **DO** implement error handling and logging from the start
- **DO** add JSDoc comments with probability/statistics notation
- **DO** create meaningful git commits after each phase
- **DO** run linting and type checking before committing
- **DO** include statistical validation tests
- **PRIORITIZE** working code over perfect code (iterate later)

### QUALITY GATES

Before marking any phase complete:
- [ ] All files compile without errors
- [ ] ESLint passes with no warnings
- [ ] Bayesian update tests pass
- [ ] Confidence intervals are statistically valid
- [ ] README accurately describes current state

---

## 📊 SUCCESS METRICS

The scaffolding is complete when:
1. `pnpm install` succeeds
2. `pnpm build` produces outputs for all packages
3. `pnpm test` runs inference tests
4. `pnpm lint` passes
5. `ptl infer --help` shows command help
6. VS Code extension loads without errors
7. Sample untyped JavaScript produces confidence-scored types
8. Migration plan prioritizes high-uncertainty locations

---

## 🔐 LICENSING BOILERPLATE

Include at the top of every source file:

```typescript
/**
 * PTL - Probabilistic Type Lattice
 * Copyright (C) 2026 Stevo (sgbilod)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Commercial licensing available at https://github.com/iamthegreatdestroyer/PTL
 * 
 * @license AGPL-3.0-or-later
 */
```

---

## 📐 MATHEMATICS & STATISTICS REFERENCE

### Bayes' Theorem
```
P(Type | Evidence) = P(Evidence | Type) × P(Type) / P(Evidence)

Posterior ∝ Likelihood × Prior
```

### Dirichlet Distribution (Conjugate Prior for Categorical)
```
Dir(α₁, α₂, ..., αₖ)

Mean: E[θᵢ] = αᵢ / Σⱼ αⱼ
Variance: Var(θᵢ) = αᵢ(α₀ - αᵢ) / (α₀²(α₀ + 1))
  where α₀ = Σⱼ αⱼ

Update rule: α_posterior = α_prior + counts
```

### Shannon Entropy (Uncertainty Measure)
```
H(X) = -Σᵢ p(xᵢ) log₂ p(xᵢ)

Properties:
- H = 0: Complete certainty (one type has probability 1)
- H = log₂(n): Maximum uncertainty (uniform over n types)
- Higher H = more uncertain = needs migration first
```

### Confidence Interval (from Dirichlet)
```
For 95% CI on probability θᵢ:

CI = [θ̂ᵢ - 1.96 × SE(θᵢ), θ̂ᵢ + 1.96 × SE(θᵢ)]

Where SE(θᵢ) = √(Var(θᵢ))
```

### Type Lattice Operations
```
Meet (∧): Greatest Lower Bound (Intersection)
  A ∧ B = most specific type that is supertype of both A and B

Join (∨): Least Upper Bound (Union)
  A ∨ B = most general type that is subtype of both A and B

Subtyping (≤):
  A ≤ B iff A is assignable to B
  
Lattice axioms:
  - ⊥ ≤ T ≤ ⊤ for all T (never ≤ any ≤ unknown)
  - Transitivity: A ≤ B ∧ B ≤ C → A ≤ C
  - Antisymmetry: A ≤ B ∧ B ≤ A → A = B
```

### KL Divergence (Change Detection)
```
D_KL(P || Q) = Σᵢ P(i) × log(P(i) / Q(i))

Used to detect if belief change is significant enough to propagate.
Threshold ≈ 0.01 bits for meaningful changes.
```

---

## 🗂️ PRIOR DATA FILES

### `prior-data/naming-conventions.json`
```json
{
  "patterns": [
    {
      "pattern": "^is[A-Z]|^has[A-Z]|^can[A-Z]|^should[A-Z]",
      "type": "boolean",
      "confidence": 0.95
    },
    {
      "pattern": "^num|^count|^total|^index|^size|^length",
      "type": "number",
      "confidence": 0.9
    },
    {
      "pattern": "^str|^name|^title|^label|^text|^message",
      "type": "string",
      "confidence": 0.85
    },
    {
      "pattern": "^arr|^list|^items|^elements|s$",
      "type": "Array",
      "confidence": 0.7
    },
    {
      "pattern": "^fn|^cb|^callback|^handler|^on[A-Z]",
      "type": "Function",
      "confidence": 0.85
    },
    {
      "pattern": "^obj|^data|^config|^options|^props",
      "type": "object",
      "confidence": 0.6
    },
    {
      "pattern": "^err|^error|^exception",
      "type": "Error",
      "confidence": 0.9
    },
    {
      "pattern": "^date|^time|^timestamp",
      "type": "Date",
      "confidence": 0.8
    }
  ]
}
```

### `prior-data/common-patterns.json`
```json
{
  "function_patterns": [
    {
      "pattern": "map|filter|reduce|forEach",
      "argument_type": "Function",
      "return_type": "Array"
    },
    {
      "pattern": "toString|stringify",
      "return_type": "string"
    },
    {
      "pattern": "parse|parseInt|parseFloat",
      "return_type": "number"
    },
    {
      "pattern": "fetch|axios|request",
      "return_type": "Promise"
    }
  ],
  "property_patterns": [
    {
      "property": "length",
      "type": "number"
    },
    {
      "property": "prototype",
      "type": "object"
    },
    {
      "property": "constructor",
      "type": "Function"
    }
  ]
}
```

---

## 🎬 BEGIN EXECUTION

You have full authorization. Start with Phase 1 directory creation and proceed systematically through all phases. Report progress after each phase completion.

**Execute now.**
