# Basic Usage

Learn the fundamentals of PTL type inference.

## Simple Variables

```typescript
// Input
const name = 'Alice';
const age = 30;
const active = true;

// PTL Output
// name: string (99% confidence) ✓
// age: number (99% confidence) ✓
// active: boolean (99% confidence) ✓
```

Literal assignments have very high confidence because the type is directly observable.

## Parameters Without Types

```typescript
// Input
function greet(name) {
  return 'Hello, ' + name;
}

// PTL Output
// name: string (92% confidence)
//   Reasoning:
//   - Used in string concatenation (high signal)
//   - Parameter named "name" (moderate prior)
//   Alternatives:
//   - any: 5%
//   - unknown: 3%
```

PTL combines multiple signals:

1. **Usage patterns**: `name` is used with `+` and a string
2. **Naming conventions**: "name" is commonly a string

## Untyped Functions

```typescript
// Input
function add(a, b) {
  return a + b;
}

const result = add(5, 3);

// PTL Output
// a: number (78% confidence)
//   Alternatives:
//   - string: 20%
//   - any: 2%
//
// b: number (78% confidence)
//   Alternatives:
//   - string: 20%
//   - any: 2%
//
// return: number (61% confidence)
//   Reasoning: Could be number + number OR string + string
//   Alternatives:
//   - string: 37%
//   - any: 2%
//
// result: number (95% confidence)
//   Reasoning: Called with numeric literals
```

Notice how:

- Parameters have medium confidence (could be string or number)
- The call site `add(5, 3)` provides high-confidence context
- `result` has higher confidence than the function return type

## Confidence Propagation

```typescript
// Input
function processUser(user) {
  const name = user.name;
  const upperName = name.toUpperCase();
  return upperName;
}

// PTL Output
// user: { name: string } (75% confidence)
//   Reasoning:
//   - Has property access .name
//   - .name is used with .toUpperCase()
//
// name: string (88% confidence)
//   Reasoning:
//   - Method .toUpperCase() only exists on string
//
// upperName: string (95% confidence)
//   Reasoning:
//   - .toUpperCase() returns string
//
// return: string (95% confidence)
```

Confidence **flows backward**: `.toUpperCase()` implies `name` is a string, which implies
`user.name` exists.

## Working with Arrays

```typescript
// Input
function sum(numbers) {
  let total = 0;
  for (const n of numbers) {
    total += n;
  }
  return total;
}

// PTL Output
// numbers: number[] (82% confidence)
//   Reasoning:
//   - Iterated with for...of
//   - Elements used with += operator
//   - Parameter named "numbers" (prior)
//
// total: number (98% confidence)
// n: number (85% confidence)
// return: number (98% confidence)
```

## Try It Yourself

Run this example:

```bash
# Clone the repository
git clone https://github.com/iamthegreatdestroyer/PTL.git
cd PTL/examples/basic

# Install dependencies
pnpm install

# Run analysis
pnpm exec ptl analyze .
```

Or try it in the [Playground](https://ptl.dev/playground?example=basic).
