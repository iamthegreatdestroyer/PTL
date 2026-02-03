# Core Concepts

Understanding the fundamental concepts behind PTL's Bayesian type inference.

## Traditional vs. Bayesian Type Inference

### Traditional Type Inference

Traditional type systems use **constraint solving**:

1. Generate constraints from code
2. Solve constraints to find a type
3. Return the type or an error

This approach is **deterministic** - each expression has exactly one type or is an error.

### Bayesian Type Inference

PTL uses **probabilistic inference**:

1. Generate constraints from code
2. Apply prior probabilities from type databases
3. Compute posterior distribution over possible types
4. Return the type with highest probability and confidence interval

This approach embraces **uncertainty** - each expression has a distribution over types.

## Key Components

### 1. Type Lattice

The type lattice organizes types in a **partial order** based on subtyping:

```
              ⊤ (top/unknown)
             /       \
        object      primitive
        /    \      /   |   \
   Array   Record  string number boolean
     |               |      |       |
   T[]            literal literal literal
     \              |      /      /
              ⊥ (bottom/never)
```

**Properties:**

- **Top type** (`unknown`): Supertype of all types
- **Bottom type** (`never`): Subtype of all types
- **Join** (∨): Least upper bound of two types
- **Meet** (∧): Greatest lower bound of two types

### 2. Prior Probabilities

**Priors** represent our knowledge about types before seeing the code:

```typescript
// Prior knowledge:
// - Parameters named "name" are usually strings (80%)
// - Parameters named "count" are usually numbers (90%)
// - Return values of functions starting with "is" are usually booleans (95%)
```

PTL uses multiple prior sources:

| Prior Source    | Description                   | Weight |
| --------------- | ----------------------------- | ------ |
| Naming patterns | Parameter/function names      | Medium |
| Call patterns   | How functions are called      | High   |
| Return patterns | What values are returned      | High   |
| Historical data | Patterns from typed codebases | Low    |

### 3. Likelihood

**Likelihood** is the probability of observing the code given a type:

```typescript
function add(a, b) {
  return a + b; // Likelihood: P(code | type)
}

// If a: number, b: number
//   P(a + b returns number) = 0.95
//   P(a + b returns string) = 0.05

// If a: string, b: string
//   P(a + b returns string) = 1.0
```

### 4. Posterior Distribution

**Bayes' theorem** combines prior and likelihood:

```
P(type | code) = P(code | type) × P(type) / P(code)

posterior = likelihood × prior / evidence
```

The result is a **distribution** over all possible types.

### 5. Confidence Intervals

PTL reports not just the most likely type, but a **confidence interval**:

```typescript
// Inference result:
{
  type: "string",
  confidence: 0.87,        // Point estimate
  interval: [0.82, 0.92],  // 95% credible interval
  alternatives: [
    { type: "any", confidence: 0.08 },
    { type: "unknown", confidence: 0.05 }
  ]
}
```

## The Inference Process

### Step 1: Parse and Extract Constraints

```typescript
function greet(name) {
  return 'Hello, ' + name;
}
```

Constraints extracted:

- `name` is used in string concatenation → likely `string`
- Return type is string concatenation result → `string`

### Step 2: Apply Priors

- Parameter named `name` → 80% prior for `string`
- String concatenation operand → 90% prior for `string`

### Step 3: Compute Likelihood

- Used in `"Hello, " + name` → high likelihood for `string`
- No numeric operations → low likelihood for `number`

### Step 4: Calculate Posterior

Using Bayes' theorem:

```
P(string | code) ∝ P(code | string) × P(string)
                 = 0.95 × 0.80
                 = 0.76

P(any | code) ∝ P(code | any) × P(any)
              = 0.80 × 0.10
              = 0.08

Normalized:
  string: 0.91
  any: 0.09
```

### Step 5: Report with Confidence

```
name: string (91% confidence)
  Interval: [86%, 96%]
  Alternatives:
    - any (9%)
```

## Confidence Levels

PTL uses three confidence levels:

| Level  | Range   | Color     | Meaning            |
| ------ | ------- | --------- | ------------------ |
| High   | 85-100% | 🟢 Green  | Very confident     |
| Medium | 60-84%  | 🟡 Yellow | Somewhat confident |
| Low    | 0-59%   | 🔴 Red    | Uncertain          |

## When PTL Shines

PTL is most useful when:

1. **Gradual Typing**: Migrating JavaScript to TypeScript
2. **Legacy Code**: Understanding existing untyped codebases
3. **Prioritization**: Knowing where to add type annotations first
4. **Confidence**: Understanding reliability of inferred types

## Limitations

PTL has some limitations:

1. **Not a Type Checker**: PTL doesn't catch type errors, it estimates types
2. **Approximation**: Bayesian inference is approximate, not exact
3. **Prior Dependency**: Quality depends on prior databases
4. **Performance**: More expensive than traditional inference

## Next Steps

- [How It Works](/guide/how-it-works) - Technical deep dive
- [Type Priors](/guide/type-priors) - Understanding priors
- [Confidence Intervals](/guide/confidence-intervals) - Interpreting results
