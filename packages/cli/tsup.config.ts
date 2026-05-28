import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  format: ['esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
  splitting: true,
  external: ['glob', 'chalk', 'ora', 'figures', 'commander', 'picocolors'],
});
