# PTL - Probabilistic Type Lattice

CI/CD workflows for the PTL monorepo.

## Workflow Overview

### `ci.yml` - Continuous Integration

Runs on every push and pull request:

- Linting
- Type checking
- Unit tests
- Build verification
- Coverage reporting

### `release.yml` - Release Automation

Triggered on pushes to main with changesets:

- Builds all packages
- Publishes to npm
- Creates GitHub releases

### `security.yml` - Security Scanning

Daily and on pull requests:

- Dependency vulnerability scanning
- CodeQL analysis
- Secret scanning

### `benchmark.yml` - Performance Benchmarks

Weekly and manually triggered:

- Runs performance benchmarks
- Compares against baseline
- Reports performance regressions
