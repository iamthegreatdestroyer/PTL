/**
 * Source File Analyzer
 *
 * Analyzes individual source files to extract symbols and observations
 * using TypeScript's compiler API for proper AST parsing.
 */

import * as ts from 'typescript';
import type { TypeLattice } from '../lattice/type-lattice.js';
import type { BayesianInferenceEngine } from '../bayesian/bayesian-inference.js';
import type { Observation, ObservationKind } from '../bayesian/types.js';
import type {
  AnalysisContext,
  FileAnalysisResult,
  SymbolInfo,
  SymbolKind,
  SymbolLocation,
  AnalysisError,
} from './types.js';

interface ASTVisitorContext extends AnalysisContext {
  sourceFile: ts.SourceFile;
  symbolTable: Map<string, SymbolDeclaration>;
  observations: Array<{ symbolId: string; observation: Observation }>;
  scopeStack: ScopeInfo[];
  imports: Map<string, string>;
  fileLevelBindings: Map<string, string>;
}

interface SymbolDeclaration {
  id: string;
  name: string;
  kind: SymbolKind;
  node: ts.Node;
  location: SymbolLocation;
  isExported: boolean;
  typeParameters: string[];
}

interface ScopeInfo {
  kind: 'function' | 'class' | 'module' | 'block';
  name: string;
  bindings: Map<string, string>;
  node: ts.Node;
}

export interface SourceFileAnalyzerOptions {
  minConfidence: number;
  maxAlternatives: number;
}

export class SourceFileAnalyzer {
  private readonly lattice: TypeLattice;
  private readonly engine: BayesianInferenceEngine;
  private readonly options: SourceFileAnalyzerOptions;

  constructor(
    lattice: TypeLattice,
    engine: BayesianInferenceEngine,
    options?: Partial<SourceFileAnalyzerOptions>
  ) {
    this.lattice = lattice;
    this.engine = engine;
    this.options = {
      minConfidence: 0.5,
      maxAlternatives: 5,
      ...options,
    };
  }

  analyze(file: string, source: string): FileAnalysisResult {
    const startTime = performance.now();
    const symbols: SymbolInfo[] = [];
    const errors: AnalysisError[] = [];

    try {
      const context: AnalysisContext = {
        currentFile: file,
        scopePath: [],
        isExported: false,
        typeParameters: new Map(),
        localBindings: new Map(),
      };

      const { observations, symbolTable, parseErrors } = this.extractObservationsWithSymbols(file, source, context);

      for (const e of parseErrors) {
        errors.push(e);
      }

      for (const { symbolId, observation } of observations) {
        this.engine.observe(symbolId, observation);
      }

      for (const [symbolId, symbolDecl] of symbolTable) {
        const inference = this.engine.infer(symbolId);
        const mostLikely = inference.mostLikely;
        const typeNode = this.lattice.getType(mostLikely.typeId);

        if (typeNode) {
          const symbolInfo: SymbolInfo = {
            id: symbolId,
            name: symbolDecl.name,
            kind: symbolDecl.kind,
            file,
            location: symbolDecl.location,
            inference,
            type: typeNode,
            confidence: mostLikely.probability,
            alternatives: inference.beliefs
              .slice(1, this.options.maxAlternatives + 1)
              .map((belief) => ({
                type: this.lattice.getType(belief.typeId) ?? typeNode,
                probability: belief.probability,
                confidence: belief.probability,
              })),
            exported: symbolDecl.isExported,
          };

          if (symbolDecl.typeParameters.length > 0) {
            (symbolInfo as unknown as Record<string, unknown>)['typeParameters'] = symbolDecl.typeParameters as readonly string[];
          }

          symbols.push(symbolInfo);
        }
      }
    } catch (error) {
      errors.push({
        code: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : String(error),
        severity: 'error',
        file,
      });
    }

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      file,
      symbols,
      symbolCount: symbols.length,
      averageConfidence:
        symbols.length > 0 ? symbols.reduce((sum, s) => sum + s.confidence, 0) / symbols.length : 0,
      errors,
      durationMs,
    };
  }

  private extractObservationsWithSymbols(
    file: string,
    source: string,
    context: AnalysisContext
  ): {
    observations: Array<{ symbolId: string; observation: Observation }>;
    symbolTable: Map<string, SymbolDeclaration>;
    parseErrors: AnalysisError[];
  } {
    const sourceFile = this.createSourceFile(file, source);
    const parseErrors: AnalysisError[] = [];

    // Collect syntax diagnostics via a minimal compiler host
    const host = ts.createCompilerHost({});
    const program = ts.createProgram([file], { noLib: true, noResolve: true }, {
      ...host,
      getSourceFile: (fileName) => fileName === file ? sourceFile : undefined,
      fileExists: () => true,
      readFile: () => source,
    });
    const syntaxDiags = program.getSyntacticDiagnostics(sourceFile);
    for (const diag of syntaxDiags) {
      parseErrors.push({
        code: `TS${diag.code}`,
        message: typeof diag.messageText === 'string' ? diag.messageText : diag.messageText.messageText,
        severity: 'error',
        file,
      });
    }

    const visitorContext: ASTVisitorContext = {
      ...context,
      sourceFile,
      symbolTable: new Map(),
      observations: [],
      scopeStack: [],
      imports: new Map(),
      fileLevelBindings: new Map(),
    };

    // Pass 1: Collect symbol declarations (populates symbolTable and fileLevelBindings)
    this.visitNode(sourceFile, visitorContext, 'declarations');

    // Pass 2: Extract type observations from usage patterns
    this.visitNode(sourceFile, visitorContext, 'observations');

    return {
      observations: visitorContext.observations,
      symbolTable: visitorContext.symbolTable,
      parseErrors,
    };
  }

  private visitNode(
    node: ts.Node,
    context: ASTVisitorContext,
    pass: 'declarations' | 'observations'
  ): void {
    if (pass === 'declarations') {
      this.visitNodeForDeclarations(node, context);
    } else {
      this.visitNodeForObservations(node, context);
    }

    ts.forEachChild(node, (child: ts.Node) => this.visitNode(child, context, pass));
  }

  private visitNodeForDeclarations(node: ts.Node, context: ASTVisitorContext): void {
    if (ts.isVariableDeclaration(node)) {
      this.visitVariableDeclaration(node, context);
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      this.visitFunctionDeclaration(node, context);
    } else if (ts.isClassDeclaration(node) && node.name) {
      this.visitClassDeclaration(node, context);
    } else if (ts.isInterfaceDeclaration(node)) {
      this.visitInterfaceDeclaration(node, context);
    } else if (ts.isTypeAliasDeclaration(node)) {
      this.visitTypeAliasDeclaration(node, context);
    } else if (ts.isImportDeclaration(node)) {
      this.visitImportDeclaration(node, context);
    }
  }

  private visitNodeForObservations(node: ts.Node, context: ASTVisitorContext): void {
    // Re-establish function scopes so param bindings are available during observation pass
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      const funcSymbolId = this.createSymbolId(context, name);
      this.pushScope(context, 'function', name, node);
      // Re-register param bindings into scope
      for (const param of node.parameters) {
        if (ts.isIdentifier(param.name)) {
          const pName = param.name.text;
          context.scopeStack[context.scopeStack.length - 1]!.bindings.set(pName, `${funcSymbolId}:param:${pName}`);
        }
      }
      ts.forEachChild(node, (child) => this.visitNode(child, context, 'observations'));
      this.popScope(context);
      return; // children already visited above
    }

    if (ts.isPropertyAccessExpression(node)) {
      this.visitPropertyAccess(node, context);
    } else if (ts.isCallExpression(node)) {
      this.visitCallExpression(node, context);
    } else if (ts.isBinaryExpression(node)) {
      this.visitBinaryExpression(node, context);
    }
  }

  // ============================================================================
  // DECLARATION VISITORS
  // ============================================================================

  private visitVariableDeclaration(node: ts.VariableDeclaration, context: ASTVisitorContext): void {
    // Handle object destructuring: const { name, age } = obj
    if (ts.isObjectBindingPattern(node.name)) {
      this.visitObjectDestructuring(node, context);
      return;
    }

    // Handle array destructuring: const [first, second] = arr
    if (ts.isArrayBindingPattern(node.name)) {
      this.visitArrayDestructuring(node, context);
      return;
    }

    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const symbolId = this.createSymbolId(context, name);

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'variable',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: this.isNodeExported(node.parent.parent as ts.Node),
      typeParameters: [],
    });

    // Register in file-level bindings for observation pass resolution
    context.fileLevelBindings.set(name, symbolId);

    // Register in current scope
    if (context.scopeStack.length > 0) {
      const currentScope = context.scopeStack[context.scopeStack.length - 1];
      if (currentScope) currentScope.bindings.set(name, symbolId);
    }

    // Type annotation (weight: 1.0) — skip top/bottom which carry no info
    if (node.type) {
      const typeId = this.extractTypeFromTypeNode(node.type);
      if (typeId && typeId !== 'type:top' && typeId !== 'type:bottom') {
        context.observations.push({
          symbolId,
          observation: this.createObservation(typeId, 'annotation', 1.0, node, context),
        });
      }
    }

    // Initializer type (weight: 0.8)
    if (node.initializer) {
      const typeId = this.inferTypeFromExpression(node.initializer, context);
      if (typeId) {
        context.observations.push({
          symbolId,
          observation: this.createObservation(typeId, 'assignment', 0.8, node.initializer, context),
        });
      }
    }
  }

  private visitObjectDestructuring(node: ts.VariableDeclaration, context: ASTVisitorContext): void {
    if (!ts.isObjectBindingPattern(node.name)) return;

    // Infer element types from initializer object literal
    const initLiteral = node.initializer && ts.isObjectLiteralExpression(node.initializer)
      ? node.initializer
      : null;

    const propTypes = new Map<string, string>();
    if (initLiteral) {
      for (const prop of initLiteral.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const typeId = this.inferTypeFromExpression(prop.initializer, context);
          if (typeId) propTypes.set(prop.name.text, typeId);
        }
      }
    }

    for (const element of node.name.elements) {
      if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
        const name = element.name.text;
        const keyName = element.propertyName && ts.isIdentifier(element.propertyName)
          ? element.propertyName.text
          : name;
        const symbolId = this.createSymbolId(context, name);

        context.symbolTable.set(symbolId, {
          id: symbolId,
          name,
          kind: 'variable',
          node: element,
          location: this.getNodeLocation(element, context.sourceFile),
          isExported: false,
          typeParameters: [],
        });

        context.fileLevelBindings.set(name, symbolId);

        const typeId = propTypes.get(keyName);
        if (typeId) {
          context.observations.push({
            symbolId,
            observation: this.createObservation(typeId, 'assignment', 0.85, element, context),
          });
        }
      }
    }
  }

  private visitArrayDestructuring(node: ts.VariableDeclaration, context: ASTVisitorContext): void {
    if (!ts.isArrayBindingPattern(node.name)) return;

    // Infer element types from array literal
    const initLiteral = node.initializer && ts.isArrayLiteralExpression(node.initializer)
      ? node.initializer
      : null;

    const elements = node.name.elements;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (!element || !ts.isBindingElement(element) || !ts.isIdentifier(element.name)) continue;

      const name = element.name.text;
      const symbolId = this.createSymbolId(context, name);

      context.symbolTable.set(symbolId, {
        id: symbolId,
        name,
        kind: 'variable',
        node: element,
        location: this.getNodeLocation(element, context.sourceFile),
        isExported: false,
        typeParameters: [],
      });

      context.fileLevelBindings.set(name, symbolId);

      // Infer from corresponding array element
      const initElement = initLiteral?.elements[i];
      if (initElement) {
        const typeId = this.inferTypeFromExpression(initElement, context);
        if (typeId) {
          context.observations.push({
            symbolId,
            observation: this.createObservation(typeId, 'assignment', 0.85, initElement, context),
          });
        }
      }
    }
  }

  private visitFunctionDeclaration(node: ts.FunctionDeclaration, context: ASTVisitorContext): void {
    if (!node.name) return;

    const name = node.name.text;
    const symbolId = this.createSymbolId(context, name);

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'function',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: this.isNodeExported(node),
      typeParameters: node.typeParameters?.map((tp: ts.TypeParameterDeclaration) => tp.name.text) ?? [],
    });

    context.fileLevelBindings.set(name, symbolId);

    context.observations.push({
      symbolId,
      observation: this.createObservation('type:function', 'assignment', 1.0, node, context),
    });

    // Extract return type
    if (node.type) {
      const returnTypeId = this.extractTypeFromTypeNode(node.type);
      if (returnTypeId) {
        context.observations.push({
          symbolId: `${symbolId}:return`,
          observation: this.createObservation(returnTypeId, 'return', 0.9, node.type, context),
        });
      }
    }

    // Push function scope and register parameters
    this.pushScope(context, 'function', name, node);

    for (const param of node.parameters) {
      this.registerParameter(param, symbolId, context);
    }

    // Extract JSDoc param types
    this.extractJSDocTypes(node, symbolId, context);

    if (node.body) {
      ts.forEachChild(node.body, (child: ts.Node) => this.visitNode(child, context, 'declarations'));
    }

    this.popScope(context);
  }

  private registerParameter(
    param: ts.ParameterDeclaration,
    funcSymbolId: string,
    context: ASTVisitorContext
  ): void {
    if (!ts.isIdentifier(param.name)) return;

    const paramName = param.name.text;
    const paramSymbolId = `${funcSymbolId}:param:${paramName}`;

    // Register as a proper symbol
    context.symbolTable.set(paramSymbolId, {
      id: paramSymbolId,
      name: paramName,
      kind: 'parameter',
      node: param,
      location: this.getNodeLocation(param, context.sourceFile),
      isExported: false,
      typeParameters: [],
    });

    // Register in current scope for observation-pass resolution
    const currentScope = context.scopeStack[context.scopeStack.length - 1];
    if (currentScope) currentScope.bindings.set(paramName, paramSymbolId);

    // Type annotation — skip top/bottom (unknown/any/never carry no specific info)
    if (param.type) {
      const typeId = this.extractTypeFromTypeNode(param.type);
      if (typeId && typeId !== 'type:top' && typeId !== 'type:bottom') {
        context.observations.push({
          symbolId: paramSymbolId,
          observation: this.createObservation(typeId, 'parameter', 0.9, param, context),
        });
      }
    }
  }

  private extractJSDocTypes(node: ts.FunctionDeclaration, funcSymbolId: string, context: ASTVisitorContext): void {
    const jsDocTags = ts.getJSDocTags(node);
    for (const tag of jsDocTags) {
      if (ts.isJSDocParameterTag(tag) && ts.isIdentifier(tag.name)) {
        const paramName = tag.name.text;
        const paramSymbolId = `${funcSymbolId}:param:${paramName}`;

        // If param not yet registered (JS file without type annotations), register it
        if (!context.symbolTable.has(paramSymbolId)) {
          // Find the param node
          const paramNode = (node as ts.FunctionDeclaration).parameters.find(
            p => ts.isIdentifier(p.name) && (p.name as ts.Identifier).text === paramName
          );
          if (paramNode) {
            context.symbolTable.set(paramSymbolId, {
              id: paramSymbolId,
              name: paramName,
              kind: 'parameter',
              node: paramNode,
              location: this.getNodeLocation(paramNode, context.sourceFile),
              isExported: false,
              typeParameters: [],
            });
          }
        }

        // Extract type from JSDoc @param {type}
        if (tag.typeExpression) {
          const typeId = this.extractTypeFromTypeNode(tag.typeExpression.type);
          if (typeId) {
            context.observations.push({
              symbolId: paramSymbolId,
              observation: this.createObservation(typeId, 'annotation', 0.9, tag, context),
            });
          }
        }
      }
    }
  }

  private visitClassDeclaration(node: ts.ClassDeclaration, context: ASTVisitorContext): void {
    if (!node.name) return;

    const name = node.name.text;
    const symbolId = this.createSymbolId(context, name);

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'class',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: this.isNodeExported(node),
      typeParameters: node.typeParameters?.map((tp: ts.TypeParameterDeclaration) => tp.name.text) ?? [],
    });

    context.fileLevelBindings.set(name, symbolId);

    context.observations.push({
      symbolId,
      observation: this.createObservation('type:object', 'assignment', 1.0, node, context),
    });

    this.pushScope(context, 'class', name, node);

    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        this.visitPropertyDeclaration(member, context, symbolId);
      } else if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
        this.visitMethodDeclaration(member, context, symbolId);
      } else if (ts.isConstructorDeclaration(member)) {
        this.visitConstructorDeclaration(member, context, symbolId);
      }
    }

    this.popScope(context);
  }

  private visitPropertyDeclaration(
    node: ts.PropertyDeclaration,
    context: ASTVisitorContext,
    classSymbolId: string
  ): void {
    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const symbolId = `${classSymbolId}.${name}`;

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'property',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: false,
      typeParameters: [],
    });

    if (node.type) {
      const typeId = this.extractTypeFromTypeNode(node.type);
      if (typeId) {
        context.observations.push({
          symbolId,
          observation: this.createObservation(typeId, 'annotation', 1.0, node.type, context),
        });
      }
    }

    if (node.initializer) {
      const typeId = this.inferTypeFromExpression(node.initializer, context);
      if (typeId) {
        context.observations.push({
          symbolId,
          observation: this.createObservation(typeId, 'assignment', 0.8, node.initializer, context),
        });
      }
    }
  }

  private visitMethodDeclaration(
    node: ts.MethodDeclaration,
    context: ASTVisitorContext,
    classSymbolId: string
  ): void {
    if (!ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const symbolId = `${classSymbolId}.${name}`;

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'method',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: false,
      typeParameters: node.typeParameters?.map((tp: ts.TypeParameterDeclaration) => tp.name.text) ?? [],
    });

    context.observations.push({
      symbolId,
      observation: this.createObservation('type:function', 'assignment', 1.0, node, context),
    });

    if (node.type) {
      const returnTypeId = this.extractTypeFromTypeNode(node.type);
      if (returnTypeId) {
        context.observations.push({
          symbolId: `${symbolId}:return`,
          observation: this.createObservation(returnTypeId, 'return', 0.9, node.type, context),
        });
      }
    }
  }

  private visitConstructorDeclaration(
    node: ts.ConstructorDeclaration,
    context: ASTVisitorContext,
    classSymbolId: string
  ): void {
    const symbolId = `${classSymbolId}.constructor`;

    this.pushScope(context, 'function', 'constructor', node);

    for (const param of node.parameters) {
      this.registerParameter(param, symbolId, context);
    }

    this.popScope(context);
  }

  private visitInterfaceDeclaration(node: ts.InterfaceDeclaration, context: ASTVisitorContext): void {
    const name = node.name.text;
    const symbolId = this.createSymbolId(context, name);

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'interface',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: this.isNodeExported(node),
      typeParameters: node.typeParameters?.map((tp: ts.TypeParameterDeclaration) => tp.name.text) ?? [],
    });

    context.fileLevelBindings.set(name, symbolId);
  }

  private visitTypeAliasDeclaration(node: ts.TypeAliasDeclaration, context: ASTVisitorContext): void {
    const name = node.name.text;
    const symbolId = this.createSymbolId(context, name);

    context.symbolTable.set(symbolId, {
      id: symbolId,
      name,
      kind: 'type-alias',
      node,
      location: this.getNodeLocation(node, context.sourceFile),
      isExported: this.isNodeExported(node),
      typeParameters: node.typeParameters?.map((tp: ts.TypeParameterDeclaration) => tp.name.text) ?? [],
    });

    context.fileLevelBindings.set(name, symbolId);
  }

  private visitImportDeclaration(node: ts.ImportDeclaration, context: ASTVisitorContext): void {
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;

    const moduleSpecifier = node.moduleSpecifier.text;

    if (node.importClause?.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        for (const element of node.importClause.namedBindings.elements) {
          const localName = element.name.text;
          const importedName = element.propertyName?.text ?? localName;
          context.imports.set(localName, `${moduleSpecifier}#${importedName}`);
        }
      } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        const name = node.importClause.namedBindings.name.text;
        context.imports.set(name, `${moduleSpecifier}#*`);
      }
    }

    if (node.importClause?.name) {
      const name = node.importClause.name.text;
      context.imports.set(name, `${moduleSpecifier}#default`);
    }
  }

  // ============================================================================
  // OBSERVATION VISITORS
  // ============================================================================

  private visitPropertyAccess(node: ts.PropertyAccessExpression, context: ASTVisitorContext): void {
    const objectSymbol = this.resolveSymbol(node.expression, context);
    if (objectSymbol) {
      context.observations.push({
        symbolId: objectSymbol,
        observation: this.createObservation('type:object', 'property', 0.7, node, context),
      });
    }
  }

  private visitCallExpression(node: ts.CallExpression, context: ASTVisitorContext): void {
    if (ts.isPropertyAccessExpression(node.expression)) {
      const objectSymbol = this.resolveSymbol(node.expression.expression, context);
      if (objectSymbol) {
        context.observations.push({
          symbolId: objectSymbol,
          observation: this.createObservation('type:object', 'method-call', 0.75, node, context),
        });
      }
    } else {
      const funcSymbol = this.resolveSymbol(node.expression, context);
      if (funcSymbol) {
        context.observations.push({
          symbolId: funcSymbol,
          observation: this.createObservation('type:function', 'method-call', 0.9, node, context),
        });
      }
    }
  }

  private visitBinaryExpression(node: ts.BinaryExpression, context: ASTVisitorContext): void {
    // typeof x === 'string'
    if (
      (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
        node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) &&
      ts.isTypeOfExpression(node.left) &&
      ts.isStringLiteral(node.right)
    ) {
      const symbolId = this.resolveSymbol(node.left.expression, context);
      const typeId = this.mapTypeOfStringToType(node.right.text);

      if (symbolId && typeId) {
        context.observations.push({
          symbolId,
          observation: this.createObservation(typeId, 'type-guard', 10.0, node, context),
        });
      }
      return;
    }

    // x instanceof SomeClass
    if (node.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword) {
      const symbolId = this.resolveSymbol(node.left, context);
      if (symbolId) {
        context.observations.push({
          symbolId,
          observation: this.createObservation('type:object', 'type-guard', 5.0, node, context),
        });
      }
      return;
    }

    // nullish coalescing: value ?? default — infer variable from RHS
    if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
      this.visitNullishCoalescing(node, context);
      return;
    }

    // Arithmetic: +, -, *, /
    if (
      node.operatorToken.kind === ts.SyntaxKind.PlusToken ||
      node.operatorToken.kind === ts.SyntaxKind.MinusToken ||
      node.operatorToken.kind === ts.SyntaxKind.AsteriskToken ||
      node.operatorToken.kind === ts.SyntaxKind.SlashToken
    ) {
      const leftSymbol = this.resolveSymbol(node.left, context);
      const rightSymbol = this.resolveSymbol(node.right, context);

      if (leftSymbol && !ts.isStringLiteral(node.left)) {
        context.observations.push({
          symbolId: leftSymbol,
          observation: this.createObservation('type:number', 'operation', 2.0, node, context),
        });
      }
      if (rightSymbol && !ts.isStringLiteral(node.right)) {
        context.observations.push({
          symbolId: rightSymbol,
          observation: this.createObservation('type:number', 'operation', 2.0, node, context),
        });
      }
    }
  }

  private visitNullishCoalescing(node: ts.BinaryExpression, context: ASTVisitorContext): void {
    // For: const value = getSomething() ?? "default"
    // If we can infer a type from the RHS literal, that's the most likely type
    const rhsTypeId = ts.isStringLiteral(node.right)
      ? 'type:string'
      : ts.isNumericLiteral(node.right)
        ? 'type:number'
        : null;

    if (rhsTypeId) {
      // The parent variable gets this type as a fallback
      const parent = node.parent;
      if (parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        const symbolId = this.resolveSymbol(parent.name, context);
        if (symbolId) {
          context.observations.push({
            symbolId,
            observation: this.createObservation(rhsTypeId, 'assignment', 0.75, node.right, context),
          });
        }
      }
    }
  }

  // ============================================================================
  // TYPE EXTRACTION
  // ============================================================================

  private extractTypeFromTypeNode(typeNode: ts.TypeNode): string | null {
    switch (typeNode.kind) {
      case ts.SyntaxKind.StringKeyword: return 'type:string';
      case ts.SyntaxKind.NumberKeyword: return 'type:number';
      case ts.SyntaxKind.BooleanKeyword: return 'type:boolean';
      case ts.SyntaxKind.VoidKeyword: return 'type:void';
      case ts.SyntaxKind.UndefinedKeyword: return 'type:undefined';
      case ts.SyntaxKind.NullKeyword: return 'type:null';
      case ts.SyntaxKind.AnyKeyword: return 'type:top';
      case ts.SyntaxKind.UnknownKeyword: return 'type:top';
      case ts.SyntaxKind.NeverKeyword: return 'type:bottom';
      case ts.SyntaxKind.ObjectKeyword: return 'type:object';
      case ts.SyntaxKind.ArrayType: return 'type:array';
      case ts.SyntaxKind.FunctionType: return 'type:function';
      default:
        if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
          return `type:${typeNode.typeName.text.toLowerCase()}`;
        }
        return null;
    }
  }

  private inferTypeFromExpression(node: ts.Expression, _context: ASTVisitorContext): string | null {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TemplateExpression:
        return 'type:string';
      case ts.SyntaxKind.NumericLiteral:
        return 'type:number';
      case ts.SyntaxKind.TrueKeyword:
      case ts.SyntaxKind.FalseKeyword:
        return 'type:boolean';
      case ts.SyntaxKind.NullKeyword:
        return 'type:null';
      case ts.SyntaxKind.UndefinedKeyword:
        return 'type:undefined';
      case ts.SyntaxKind.ArrayLiteralExpression:
        return 'type:array';
      case ts.SyntaxKind.ObjectLiteralExpression:
        return 'type:object';
      case ts.SyntaxKind.ArrowFunction:
      case ts.SyntaxKind.FunctionExpression:
        return 'type:function';
      case ts.SyntaxKind.NewExpression:
        return this.inferTypeFromNewExpression(node as ts.NewExpression);
      default:
        // Method chain: call expression on a property — infer from method name
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          const method = node.expression.name.text;
          if (method === 'split') return 'type:array';
          if (method === 'map' || method === 'filter') return 'type:array';
          if (method === 'join' || method === 'toString' || method === 'toLowerCase' || method === 'toUpperCase' || method === 'trim') return 'type:string';
          if (method === 'parseInt' || method === 'parseFloat' || method === 'length') return 'type:number';
        }
        // Nullish coalescing: infer from RHS
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
          return this.inferTypeFromExpression(node.right, _context);
        }
        return null;
    }
  }

  private inferTypeFromNewExpression(node: ts.NewExpression): string | null {
    if (ts.isIdentifier(node.expression)) {
      switch (node.expression.text) {
        case 'Date': return 'type:date';
        case 'RegExp': return 'type:regexp';
        case 'Promise': return 'type:promise';
        case 'Map': return 'type:map';
        case 'Set': return 'type:set';
        case 'Array': return 'type:array';
        default: return 'type:object';
      }
    }
    return 'type:object';
  }

  private mapTypeOfStringToType(typeofString: string): string | null {
    switch (typeofString) {
      case 'string': return 'type:string';
      case 'number': return 'type:number';
      case 'boolean': return 'type:boolean';
      case 'undefined': return 'type:undefined';
      case 'object': return 'type:object';
      case 'function': return 'type:function';
      case 'symbol': return 'type:symbol';
      case 'bigint': return 'type:bigint';
      default: return null;
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private createSourceFile(file: string, source: string): ts.SourceFile {
    return ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
  }

  private getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile): SymbolLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return {
      startLine: start.line + 1,
      startColumn: start.character,
      endLine: end.line + 1,
      endColumn: end.character,
    };
  }

  private isNodeExported(node: ts.Node): boolean {
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node);
      return modifiers?.some((m: ts.Modifier) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    }
    return false;
  }

  private createSymbolId(context: ASTVisitorContext, name: string): string {
    const path = context.scopeStack.map((s) => s.name).join('.');
    return path ? `${context.currentFile}#${path}.${name}` : `${context.currentFile}#${name}`;
  }

  private pushScope(context: ASTVisitorContext, kind: ScopeInfo['kind'], name: string, node: ts.Node): void {
    context.scopeStack.push({ kind, name, bindings: new Map(), node });
  }

  private popScope(context: ASTVisitorContext): void {
    context.scopeStack.pop();
  }

  private resolveSymbol(node: ts.Expression, context: ASTVisitorContext): string | null {
    if (ts.isIdentifier(node)) {
      const name = node.text;

      // Search scope stack innermost → outermost
      for (let i = context.scopeStack.length - 1; i >= 0; i--) {
        const scope = context.scopeStack[i];
        if (scope?.bindings.has(name)) return scope.bindings.get(name)!;
      }

      // File-level bindings (populated during declarations pass)
      if (context.fileLevelBindings.has(name)) return context.fileLevelBindings.get(name)!;

      // Imports
      if (context.imports.has(name)) return context.imports.get(name)!;

      // Fallback: file-level symbol
      return `${context.currentFile}#${name}`;
    }
    return null;
  }

  private createObservation(
    typeId: string,
    kind: ObservationKind,
    weight: number,
    node: ts.Node,
    context: ASTVisitorContext
  ): Observation {
    const location = this.getNodeLocation(node, context.sourceFile);
    return {
      typeId,
      kind,
      weight,
      source: {
        file: context.currentFile,
        line: location.startLine,
        column: location.startColumn,
      },
      timestamp: Date.now(),
    };
  }
}
