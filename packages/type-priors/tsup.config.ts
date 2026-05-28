import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    data: 'src/data.ts',
  },
  format: ['esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false,
    },
  },
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,
  target: 'node20',
  outDir: 'dist',
});
