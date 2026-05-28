/**
 * Mock file system for testing
 */

/**
 * In-memory file system for tests
 */
export class MockFileSystem {
  private files: Map<string, string>;
  private directories: Set<string>;

  constructor(initialFiles: Record<string, string> = {}) {
    this.files = new Map(Object.entries(initialFiles));
    this.directories = new Set();

    // Extract directories from file paths
    for (const path of this.files.keys()) {
      this.addDirectoryPath(path);
    }
  }

  private addDirectoryPath(filePath: string): void {
    const parts = filePath.split(/[/\\]/);
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current += (current ? '/' : '') + parts[i];
      this.directories.add(current);
    }
  }

  readFile(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const content = this.files.get(normalizedPath);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  writeFile(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);
    this.files.set(normalizedPath, content);
    this.addDirectoryPath(normalizedPath);
  }

  deleteFile(path: string): void {
    const normalizedPath = this.normalizePath(path);
    if (!this.files.has(normalizedPath)) {
      throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
    }
    this.files.delete(normalizedPath);
  }

  exists(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.has(normalizedPath) || this.directories.has(normalizedPath);
  }

  isFile(path: string): boolean {
    return this.files.has(this.normalizePath(path));
  }

  isDirectory(path: string): boolean {
    return this.directories.has(this.normalizePath(path));
  }

  readdir(path: string): string[] {
    const normalizedPath = this.normalizePath(path);
    const entries = new Set<string>();

    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(normalizedPath + '/')) {
        const relative = filePath.slice(normalizedPath.length + 1);
        const firstPart = relative.split('/')[0] ?? relative;
        entries.add(firstPart);
      }
    }

    return [...entries];
  }

  mkdir(path: string, options?: { recursive?: boolean }): void {
    const normalizedPath = this.normalizePath(path);

    if (options?.recursive) {
      const parts = normalizedPath.split('/');
      let current = '';
      for (const part of parts) {
        current += (current ? '/' : '') + part;
        this.directories.add(current);
      }
    } else {
      this.directories.add(normalizedPath);
    }
  }

  glob(pattern: string): string[] {
    const regex = this.patternToRegex(pattern);
    return [...this.files.keys()].filter((path) => regex.test(path));
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/^\.\//, '');
  }

  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');
    return new RegExp(`^${escaped}$`);
  }

  reset(): void {
    this.files.clear();
    this.directories.clear();
  }

  getState(): Record<string, string> {
    return Object.fromEntries(this.files);
  }

  loadState(state: Record<string, string>): void {
    this.files = new Map(Object.entries(state));
    this.directories.clear();
    for (const path of this.files.keys()) {
      this.addDirectoryPath(path);
    }
  }
}

/**
 * Create a mock file system with common TypeScript project structure
 */
export function createTypescriptProjectMock(): MockFileSystem {
  return new MockFileSystem({
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        strict: true,
      },
    }),
    'package.json': JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
    }),
    'src/index.ts': 'export {}',
  });
}

/**
 * Create a mock with sample source files
 */
export function createSourceFilesMock(): MockFileSystem {
  return new MockFileSystem({
    'src/utils.ts': `
export function add(a, b) {
  return a + b;
}

export function greet(name) {
  return "Hello, " + name;
}
`,
    'src/types.ts': `
export interface User {
  id: number;
  name: string;
}
`,
    'src/api.ts': `
async function fetchUser(id) {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}
`,
  });
}
