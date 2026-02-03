/**
 * Dependency Graph
 *
 * Tracks dependencies between symbols for incremental type inference.
 * The graph is bidirectional: we track both what a symbol depends on
 * and what depends on the symbol.
 */

import type { DependencyNode, DependencyKind } from './types.js';

/**
 * Dependency Graph for tracking symbol relationships
 */
export class DependencyGraph {
  /** All nodes indexed by symbol ID */
  private readonly nodes: Map<string, MutableNode> = new Map();

  /** Index of symbols by file */
  private readonly byFile: Map<string, Set<string>> = new Map();

  /**
   * Get or create a node for a symbol
   */
  private getOrCreateNode(symbolId: string, file?: string): MutableNode {
    let node = this.nodes.get(symbolId);

    if (!node) {
      node = {
        symbolId,
        file: file ?? 'unknown',
        dependencies: new Set(),
        dependents: new Set(),
        dependencyKinds: new Map(),
        lastUpdated: Date.now(),
        dirty: false,
      };
      this.nodes.set(symbolId, node);

      // Add to file index
      if (file) {
        let fileSymbols = this.byFile.get(file);
        if (!fileSymbols) {
          fileSymbols = new Set();
          this.byFile.set(file, fileSymbols);
        }
        fileSymbols.add(symbolId);
      }
    }

    return node;
  }

  /**
   * Add a dependency relationship
   *
   * @param from - The symbol that depends on another
   * @param to - The symbol being depended upon
   * @param kind - The kind of dependency
   */
  addDependency(from: string, to: string, kind: DependencyKind, fromFile?: string): void {
    if (from === to) return; // No self-dependencies

    const fromNode = this.getOrCreateNode(from, fromFile);
    const toNode = this.getOrCreateNode(to);

    fromNode.dependencies.add(to);
    fromNode.dependencyKinds.set(to, kind);

    toNode.dependents.add(from);
  }

  /**
   * Remove a dependency relationship
   */
  removeDependency(from: string, to: string): boolean {
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);

    if (!fromNode || !toNode) return false;

    fromNode.dependencies.delete(to);
    fromNode.dependencyKinds.delete(to);
    toNode.dependents.delete(from);

    return true;
  }

  /**
   * Get a node by symbol ID
   */
  getNode(symbolId: string): DependencyNode | undefined {
    return this.nodes.get(symbolId);
  }

  /**
   * Check if a symbol exists in the graph
   */
  hasSymbol(symbolId: string): boolean {
    return this.nodes.has(symbolId);
  }

  /**
   * Get all direct dependencies of a symbol
   */
  getDependencies(symbolId: string): ReadonlySet<string> {
    return this.nodes.get(symbolId)?.dependencies ?? new Set();
  }

  /**
   * Get all direct dependents of a symbol
   */
  getDependents(symbolId: string): ReadonlySet<string> {
    return this.nodes.get(symbolId)?.dependents ?? new Set();
  }

  /**
   * Get the kind of dependency between two symbols
   */
  getDependencyKind(from: string, to: string): DependencyKind | undefined {
    return this.nodes.get(from)?.dependencyKinds.get(to);
  }

  /**
   * Get all symbols in a file
   */
  getSymbolsInFile(file: string): ReadonlySet<string> {
    return this.byFile.get(file) ?? new Set();
  }

  /**
   * Get transitive dependencies (all symbols this symbol depends on, recursively)
   */
  getTransitiveDependencies(symbolId: string, maxDepth: number = Infinity): Set<string> {
    const result = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: symbolId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (depth > maxDepth) continue;

      const node = this.nodes.get(id);
      if (!node) continue;

      for (const dep of node.dependencies) {
        if (!result.has(dep)) {
          result.add(dep);
          queue.push({ id: dep, depth: depth + 1 });
        }
      }
    }

    return result;
  }

  /**
   * Get transitive dependents (all symbols that depend on this, recursively)
   */
  getTransitiveDependents(symbolId: string, maxDepth: number = Infinity): Set<string> {
    const result = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: symbolId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (depth > maxDepth) continue;

      const node = this.nodes.get(id);
      if (!node) continue;

      for (const dep of node.dependents) {
        if (!result.has(dep)) {
          result.add(dep);
          queue.push({ id: dep, depth: depth + 1 });
        }
      }
    }

    return result;
  }

  /**
   * Mark a symbol as dirty (needs re-inference)
   */
  markDirty(symbolId: string): void {
    const node = this.nodes.get(symbolId);
    if (node) {
      node.dirty = true;
      node.lastUpdated = Date.now();
    }
  }

  /**
   * Mark a symbol as clean
   */
  markClean(symbolId: string): void {
    const node = this.nodes.get(symbolId);
    if (node) {
      node.dirty = false;
    }
  }

  /**
   * Get all dirty symbols
   */
  getDirtySymbols(): string[] {
    const dirty: string[] = [];
    for (const [symbolId, node] of this.nodes) {
      if (node.dirty) {
        dirty.push(symbolId);
      }
    }
    return dirty;
  }

  /**
   * Remove a symbol and all its relationships
   */
  removeSymbol(symbolId: string): boolean {
    const node = this.nodes.get(symbolId);
    if (!node) return false;

    // Remove from dependencies of other nodes
    for (const dep of node.dependencies) {
      const depNode = this.nodes.get(dep);
      if (depNode) {
        depNode.dependents.delete(symbolId);
      }
    }

    // Remove from dependents of other nodes
    for (const dependent of node.dependents) {
      const depNode = this.nodes.get(dependent);
      if (depNode) {
        depNode.dependencies.delete(symbolId);
        depNode.dependencyKinds.delete(symbolId);
      }
    }

    // Remove from file index
    const fileSymbols = this.byFile.get(node.file);
    if (fileSymbols) {
      fileSymbols.delete(symbolId);
      if (fileSymbols.size === 0) {
        this.byFile.delete(node.file);
      }
    }

    // Remove the node itself
    return this.nodes.delete(symbolId);
  }

  /**
   * Remove all symbols in a file
   */
  removeFile(file: string): number {
    const symbols = this.byFile.get(file);
    if (!symbols) return 0;

    let count = 0;
    for (const symbolId of [...symbols]) {
      if (this.removeSymbol(symbolId)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Detect cycles in the dependency graph
   */
  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (symbolId: string): boolean => {
      visited.add(symbolId);
      recursionStack.add(symbolId);
      path.push(symbolId);

      const node = this.nodes.get(symbolId);
      if (node) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep)) {
            if (dfs(dep)) return true;
          } else if (recursionStack.has(dep)) {
            // Found a cycle
            const cycleStart = path.indexOf(dep);
            cycles.push(path.slice(cycleStart));
            return true;
          }
        }
      }

      path.pop();
      recursionStack.delete(symbolId);
      return false;
    };

    for (const symbolId of this.nodes.keys()) {
      if (!visited.has(symbolId)) {
        dfs(symbolId);
      }
    }

    return cycles;
  }

  /**
   * Get topological order of the graph (for processing in dependency order)
   */
  topologicalSort(): string[] | null {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Initialize in-degrees
    for (const [symbolId, node] of this.nodes) {
      inDegree.set(symbolId, node.dependencies.size);
      if (node.dependencies.size === 0) {
        queue.push(symbolId);
      }
    }

    while (queue.length > 0) {
      const symbolId = queue.shift()!;
      result.push(symbolId);

      const node = this.nodes.get(symbolId);
      if (node) {
        for (const dependent of node.dependents) {
          const degree = (inDegree.get(dependent) ?? 0) - 1;
          inDegree.set(dependent, degree);
          if (degree === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    // If result doesn't contain all nodes, there's a cycle
    if (result.length !== this.nodes.size) {
      return null;
    }

    return result;
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    dirtyCount: number;
    averageFanout: number;
    maxFanout: number;
    maxFanin: number;
    fileCount: number;
  } {
    let edgeCount = 0;
    let dirtyCount = 0;
    let maxFanout = 0;
    let maxFanin = 0;

    for (const node of this.nodes.values()) {
      edgeCount += node.dependencies.size;
      if (node.dirty) dirtyCount++;
      maxFanout = Math.max(maxFanout, node.dependents.size);
      maxFanin = Math.max(maxFanin, node.dependencies.size);
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount,
      dirtyCount,
      averageFanout: this.nodes.size > 0 ? edgeCount / this.nodes.size : 0,
      maxFanout,
      maxFanin,
      fileCount: this.byFile.size,
    };
  }

  /**
   * Get all symbol IDs
   */
  getAllSymbols(): string[] {
    return [...this.nodes.keys()];
  }

  /**
   * Get all files
   */
  getAllFiles(): string[] {
    return [...this.byFile.keys()];
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
    this.byFile.clear();
  }

  /**
   * Serialize to JSON
   */
  toJSON(): object {
    const nodes: object[] = [];

    for (const node of this.nodes.values()) {
      nodes.push({
        symbolId: node.symbolId,
        file: node.file,
        dependencies: [...node.dependencies],
        dependents: [...node.dependents],
        dependencyKinds: Object.fromEntries(node.dependencyKinds),
        lastUpdated: node.lastUpdated,
        dirty: node.dirty,
      });
    }

    return { nodes };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: {
    nodes: Array<{
      symbolId: string;
      file: string;
      dependencies: string[];
      dependents: string[];
      dependencyKinds: Record<string, DependencyKind>;
      lastUpdated: number;
      dirty: boolean;
    }>;
  }): DependencyGraph {
    const graph = new DependencyGraph();

    for (const nodeData of json.nodes) {
      const node: MutableNode = {
        symbolId: nodeData.symbolId,
        file: nodeData.file,
        dependencies: new Set(nodeData.dependencies),
        dependents: new Set(nodeData.dependents),
        dependencyKinds: new Map(
          Object.entries(nodeData.dependencyKinds) as [string, DependencyKind][]
        ),
        lastUpdated: nodeData.lastUpdated,
        dirty: nodeData.dirty,
      };

      graph.nodes.set(node.symbolId, node);

      // Update file index
      let fileSymbols = graph.byFile.get(node.file);
      if (!fileSymbols) {
        fileSymbols = new Set();
        graph.byFile.set(node.file, fileSymbols);
      }
      fileSymbols.add(node.symbolId);
    }

    return graph;
  }
}

/**
 * Mutable version of DependencyNode for internal use
 */
interface MutableNode {
  symbolId: string;
  file: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  dependencyKinds: Map<string, DependencyKind>;
  lastUpdated: number;
  dirty: boolean;
}
