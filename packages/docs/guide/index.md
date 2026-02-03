# Introduction

**PTL (Probabilistic Type Lattice)** is a revolutionary approach to type inference that embraces
uncertainty. Instead of binary pass/fail type checking, PTL provides **confidence intervals** for
every type inference.

## The Problem with Traditional Types

Traditional type systems are deterministic:

```typescript
// TypeScript says: ❌ Error or ✅ OK
function add(a, b) {
  return a + b;
}
```

But in real-world JavaScript/TypeScript codebases, types often exist in a gray area:

- Parameters might be used with multiple types
- Functions might return different types in different contexts
- Legacy code might have implicit type coercions

## PTL's Solution

PTL uses **Bayesian inference** to calculate confidence intervals for every type:

```typescript
function add(a, b) {
  return a + b;
}

// PTL infers:
// a: number (78% confidence) | string (22%)
// b: number (78% confidence) | string (22%)
// return: number (61%) | string (39%)
```

## Key Concepts

### 1. Confidence Intervals

Every type inference comes with a confidence score between 0% and 100%:

| Confidence | Interpretation                                 |
| ---------- | ---------------------------------------------- |
| 90-100%    | Very high confidence, almost certainly correct |
| 75-89%     | High confidence, likely correct                |
| 60-74%     | Medium confidence, probably correct            |
| 40-59%     | Low confidence, could go either way            |
| 0-39%      | Very low, consider adding explicit types       |

### 2. Type Priors

PTL uses **prior knowledge** about common type patterns. These priors come from analyzing millions
of lines of typed code to understand:

- What types are commonly used together?
- What types do certain function names typically accept?
- What are common return types for various patterns?

### 3. Type Lattice

Types are organized in a **lattice structure** with subtyping relationships:

```
        unknown (top)
       /    |    \
   object function primitive
    /  \           /   |   \
 Array Record  string number boolean
   |      |        |      |      |
   ...   ...     literal literal literal
        \         |      /      /
              never (bottom)
```

## Benefits

1. **Gradual Adoption**: See which parts of your codebase have high vs. low type confidence
2. **Prioritization**: Focus type annotations where they matter most (low confidence areas)
3. **Better Understanding**: See alternative types that PTL considered
4. **Informed Decisions**: Know when to trust inferred types vs. add explicit annotations

## Next Steps

- [Quick Start](/guide/quick-start) - Get PTL running in 5 minutes
- [Installation](/guide/installation) - Detailed installation instructions
- [Core Concepts](/guide/core-concepts) - Deep dive into how PTL works
