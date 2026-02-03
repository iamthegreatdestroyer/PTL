import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'lattice/index': 'src/lattice/index.ts',
    'bayesian/index': 'src/bayesian/index.ts',
    'incremental/index': 'src/incremental/index.ts',
    'analyzer/index': 'src/analyzer/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: true,
  treeshake: true,
  minify: false,
  external: ['typescript'],
});
