import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createInMemoryFs } from '../../fs';

describe('File System Utilities', () => {
  describe('createInMemoryFs', () => {
    it('should create an in-memory file system', () => {
      const memFs = createInMemoryFs();
      expect(memFs).toBeDefined();
      expect(typeof memFs.readFile).toBe('function');
      expect(typeof memFs.writeFile).toBe('function');
    });

    it('should write and read files', async () => {
      const memFs = createInMemoryFs();

      await memFs.writeFile('/test.ts', 'const x = 1;');
      const content = await memFs.readFile('/test.ts');

      expect(content).toBe('const x = 1;');
    });

    it('should throw when reading non-existent file', async () => {
      const memFs = createInMemoryFs();

      await expect(memFs.readFile('/nonexistent.ts')).rejects.toThrow();
    });

    it('should check file existence', async () => {
      const memFs = createInMemoryFs();

      await memFs.writeFile('/exists.ts', 'content');

      expect(await memFs.exists('/exists.ts')).toBe(true);
      expect(await memFs.exists('/not-exists.ts')).toBe(false);
    });

    it('should delete files', async () => {
      const memFs = createInMemoryFs();

      await memFs.writeFile('/to-delete.ts', 'content');
      expect(await memFs.exists('/to-delete.ts')).toBe(true);

      await memFs.deleteFile('/to-delete.ts');
      expect(await memFs.exists('/to-delete.ts')).toBe(false);
    });

    it('should list directory contents', async () => {
      const memFs = createInMemoryFs();

      await memFs.mkdir('/src', { recursive: true });
      await memFs.writeFile('/src/a.ts', 'const a = 1;');
      await memFs.writeFile('/src/b.ts', 'const b = 2;');
      await memFs.writeFile('/src/c.ts', 'const c = 3;');

      const files = await memFs.readdir('/src');

      expect(files).toHaveLength(3);
      expect(files).toContain('a.ts');
      expect(files).toContain('b.ts');
      expect(files).toContain('c.ts');
    });

    it('should create nested directories', async () => {
      const memFs = createInMemoryFs();

      await memFs.mkdir('/a/b/c', { recursive: true });
      await memFs.writeFile('/a/b/c/test.ts', 'content');

      expect(await memFs.exists('/a/b/c/test.ts')).toBe(true);
    });

    it('should match glob patterns', async () => {
      const memFs = createInMemoryFs();

      await memFs.mkdir('/src', { recursive: true });
      await memFs.writeFile('/src/utils.ts', '');
      await memFs.writeFile('/src/utils.test.ts', '');
      await memFs.writeFile('/src/index.ts', '');

      const testFiles = await memFs.glob('**/*.test.ts');

      expect(testFiles).toHaveLength(1);
      expect(testFiles[0]).toContain('utils.test.ts');
    });
  });

  describe('isFile / isDirectory', () => {
    it('should distinguish files from directories', async () => {
      const memFs = createInMemoryFs();

      await memFs.mkdir('/dir', { recursive: true });
      await memFs.writeFile('/dir/file.ts', 'content');

      expect(await memFs.isFile('/dir/file.ts')).toBe(true);
      expect(await memFs.isDirectory('/dir/file.ts')).toBe(false);

      expect(await memFs.isFile('/dir')).toBe(false);
      expect(await memFs.isDirectory('/dir')).toBe(true);
    });
  });

  describe('path operations', () => {
    it('should normalize paths', async () => {
      const memFs = createInMemoryFs();

      await memFs.writeFile('/src/./utils/../utils/helper.ts', 'content');

      expect(await memFs.exists('/src/utils/helper.ts')).toBe(true);
    });

    it('should handle Windows-style paths', async () => {
      const memFs = createInMemoryFs();

      // The memory fs should normalize path separators
      await memFs.writeFile('/src\\utils\\test.ts', 'content');

      // Reading with normalized path should work
      expect(await memFs.exists('/src/utils/test.ts')).toBe(true);
    });
  });

  describe('file state management', () => {
    it('should get complete file system state', async () => {
      const memFs = createInMemoryFs();

      await memFs.writeFile('/a.ts', 'a');
      await memFs.writeFile('/b.ts', 'b');

      const state = memFs.getState();

      expect(state['/a.ts']).toBe('a');
      expect(state['/b.ts']).toBe('b');
    });

    it('should load state from object', async () => {
      const memFs = createInMemoryFs();

      memFs.loadState({
        '/preloaded.ts': 'export const x = 1;',
        '/nested/file.ts': 'export const y = 2;',
      });

      expect(await memFs.exists('/preloaded.ts')).toBe(true);
      expect(await memFs.exists('/nested/file.ts')).toBe(true);
    });

    it('should reset file system', async () => {
      const memFs = createInMemoryFs();

      await memFs.writeFile('/test.ts', 'content');
      memFs.reset();

      expect(await memFs.exists('/test.ts')).toBe(false);
    });
  });
});
