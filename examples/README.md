# PTL Examples

This directory contains example code demonstrating PTL's Bayesian type inference capabilities.

## Running Examples

```bash
# Install dependencies
pnpm install

# Run specific example
pnpm run example:basic
pnpm run example:functions
pnpm run example:objects
pnpm run example:generics
pnpm run example:react

# Run all examples
pnpm run example:all

# Generate detailed report
pnpm run report
```

## Example Categories

### Basic (`basic/`)

Simple variable and parameter inference examples.

- Variable type inference
- Parameter type inference
- Return type inference

### Functions (`functions/`)

Function-focused examples.

- Arrow functions
- Higher-order functions
- Callbacks and async functions
- Method inference

### Objects (`objects/`)

Object and interface type inference.

- Object literal types
- Nested objects
- Optional properties
- Type narrowing

### Generics (`generics/`)

Generic type inference patterns.

- Generic functions
- Generic classes
- Type constraints
- Mapped types

### React App (`react-app/`)

React-specific patterns.

- Component props inference
- Hook return types
- Event handler types
- Context types

## Confidence Levels

Each example shows PTL's confidence levels:

| Level     | Range   | Meaning         |
| --------- | ------- | --------------- |
| 🟢 High   | 85-100% | Very confident  |
| 🟡 Medium | 60-84%  | Likely correct  |
| 🔴 Low    | 0-59%   | Needs attention |

## Adding New Examples

1. Create a new directory for your example category
2. Add `.ts` or `.js` files with your example code
3. Update `package.json` with a new script
4. Run `pnpm run example:your-example`
