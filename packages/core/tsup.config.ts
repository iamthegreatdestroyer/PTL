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
  async onSuccess() {
    // Rewrite `import * as ts from 'typescript'` in ESM output to use createRequire
    // so the CJS typescript package works correctly in an ESM context.
    const { readFile, writeFile } = await import('node:fs/promises');
    const { glob } = await import('glob');
    const files = await glob('dist/**/*.js');
    for (const file of files) {
      let content = await readFile(file, 'utf-8');
      if (content.includes("import * as ts from 'typescript'")) {
        content = content.replace(
          "import * as ts from 'typescript';",
          `import { createRequire as __crqTs } from 'node:module';\nconst ts = __crqTs(import.meta.url)('typescript');`
        );
        await writeFile(file, content, 'utf-8');
      }
    }
  },
});
