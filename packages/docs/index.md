---
layout: home

hero:
  name: 'PTL'
  text: 'Probabilistic Type Lattice'
  tagline: Bayesian type inference that tells you how confident it is
  image:
    src: /logo.svg
    alt: PTL Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Playground
      link: https://ptl.dev/playground
    - theme: alt
      text: View on GitHub
      link: https://github.com/iamthegreatdestroyer/PTL

features:
  - icon: 🎯
    title: Confidence Intervals
    details:
      Every type inference comes with a confidence score, so you know how reliable each inference
      is.
  - icon: 📊
    title: Bayesian Inference
    details: Uses prior knowledge from type databases to make more informed type predictions.
  - icon: 🔗
    title: Type Lattice
    details: Types are organized in a lattice structure with proper subtyping relationships.
  - icon: 🛠️
    title: Developer Tools
    details: VS Code extension, CLI, and web playground for seamless integration into your workflow.
  - icon: ⚡
    title: Incremental Analysis
    details:
      Efficiently updates type information as you edit, without re-analyzing the entire codebase.
  - icon: 🔌
    title: Extensible
    details: Add custom type priors and configure inference behavior to match your project's needs.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(120deg, #007acc 30%, #22c55e);
  --vp-home-hero-image-background-image: linear-gradient(60deg, #007acc33 50%, #22c55e33 50%);
  --vp-home-hero-image-filter: blur(40px);
}
</style>

## Why PTL?

Traditional type systems give you binary answers: either a type is valid or it's an error. But
real-world code often exists in a gray area. **PTL embraces uncertainty** and tells you exactly how
confident it is in each type inference.

```typescript
function greet(name) {
  return 'Hello, ' + name;
}
// PTL infers: name: string (92% confidence)
// Alternative: name: any (8% confidence)
```

## Quick Example

```bash
# Install PTL
pnpm add @ptl/core @ptl/cli

# Analyze your code
ptl analyze src/

# See types with confidence intervals
ptl report --format=detailed
```

## Confidence Levels

| Level     | Range   | Meaning                           |
| --------- | ------- | --------------------------------- |
| 🟢 High   | 85-100% | Very confident in this type       |
| 🟡 Medium | 60-84%  | Likely correct, some alternatives |
| 🔴 Low    | 0-59%   | Uncertain, consider adding types  |

## Get Started

Ready to try PTL? Check out the [Quick Start Guide](/guide/quick-start) or jump straight into the
[Playground](https://ptl.dev/playground).
