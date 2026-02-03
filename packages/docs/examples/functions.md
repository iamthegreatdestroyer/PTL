# Function Inference

Understanding how PTL infers function types.

## Basic Function Inference

```typescript
// Input
function multiply(x, y) {
  return x * y;
}

// PTL Output
// x: number (95% confidence)
//   Reasoning: * operator only works with numbers
//
// y: number (95% confidence)
//   Reasoning: * operator only works with numbers
//
// return: number (98% confidence)
//   Reasoning: number * number = number
```

Arithmetic operators like `*`, `-`, `/` strongly indicate numeric types.

## Arrow Functions

```typescript
// Input
const greet = (name) => `Hello, ${name}!`;

const add = (a, b) => a + b;

const isEven = (n) => n % 2 === 0;

// PTL Output
// greet: (name: string) => string (90% confidence)
// add: (a: number | string, b: number | string) => number | string (65% confidence)
// isEven: (n: number) => boolean (95% confidence)
```

Notice how:

- Template literals indicate string
- `%` operator indicates number
- `+` is ambiguous (could be string or number)

## Higher-Order Functions

```typescript
// Input
function map(array, fn) {
  const result = [];
  for (const item of array) {
    result.push(fn(item));
  }
  return result;
}

const doubled = map([1, 2, 3], (x) => x * 2);

// PTL Output
// array: any[] (70% confidence)
//   Reasoning: Iterated, generic usage pattern
//
// fn: (item: any) => any (65% confidence)
//   Reasoning: Called with array items
//
// result: any[] (80% confidence)
//
// doubled: number[] (92% confidence)
//   Reasoning: Called with number[] and numeric transformer
```

The generic function has lower confidence, but specific usages have high confidence.

## Callback Patterns

```typescript
// Input
function fetchData(url, callback) {
  // async operation
  callback(null, { data: [] });
}

fetchData('/api/users', (error, response) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(response.data);
});

// PTL Output
// url: string (88% confidence)
//   Reasoning: Named "url", common pattern
//
// callback: (error: Error | null, response: { data: any[] }) => void (75% confidence)
//   Reasoning: Node.js callback pattern detected
//
// error: Error | null (80% confidence)
// response: { data: any[] } (78% confidence)
```

PTL recognizes common patterns like Node.js-style callbacks.

## Method Inference

```typescript
// Input
class Calculator {
  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return a - b;
  }

  multiply(a, b) {
    return a * b;
  }
}

// PTL Output
// add: (a: number | string, b: number | string) => number | string (65%)
// subtract: (a: number, b: number) => number (95%)
// multiply: (a: number, b: number) => number (95%)
```

Class context and method names provide additional priors.

## Async Functions

```typescript
// Input
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data;
}

// PTL Output
// id: string | number (72% confidence)
//   Reasoning: Used in URL template
//
// response: Response (98% confidence)
//   Reasoning: fetch() returns Response
//
// data: any (60% confidence)
//   Reasoning: .json() returns Promise<any>
//
// return: Promise<any> (95% confidence)
//   Reasoning: async function
```

## Function Overloads

```typescript
// Input
function format(value) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
}

// PTL Output
// value: string | number | unknown (60% confidence)
//   Reasoning: Type guards suggest multiple types
//   Distribution:
//   - string: 35%
//   - number: 35%
//   - other: 30%
//
// return: string (90% confidence)
//   Reasoning: All branches return string
```

Type guards provide evidence for union types.

## Best Practices

1. **Use arithmetic operators** for numeric parameters
2. **Use string methods** to indicate string types
3. **Type callbacks explicitly** for better inference
4. **Name parameters meaningfully** to leverage priors
