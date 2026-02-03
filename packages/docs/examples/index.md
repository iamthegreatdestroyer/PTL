# Examples Overview

Learn PTL through practical examples.

## Basic Examples

<div class="example-grid">

### [Basic Usage](/examples/basic)

Simple variable and parameter inference.

### [Function Inference](/examples/functions)

Inferring function parameter and return types.

### [Object Types](/examples/objects)

Working with object and interface types.

### [Generic Types](/examples/generics)

Understanding generic type inference.

</div>

## Advanced Examples

### [Custom Priors](/examples/custom-priors)

Create and use custom type prior databases.

### [CI Integration](/examples/ci-integration)

Set up PTL in your CI/CD pipeline.

### [VS Code Workflows](/examples/vscode-workflows)

Effective use of the VS Code extension.

## Interactive Playground

Try these examples live in the [PTL Playground](https://ptl.dev/playground).

## Code Samples

All examples are available in the
[examples directory](https://github.com/iamthegreatdestroyer/PTL/tree/main/examples) on GitHub.

```bash
git clone https://github.com/iamthegreatdestroyer/PTL.git
cd PTL/examples
pnpm install
pnpm run example:basic
```

<style>
.example-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}
</style>
