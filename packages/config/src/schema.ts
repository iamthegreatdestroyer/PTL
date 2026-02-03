/**
 * Configuration Schema
 *
 * JSON Schema definitions for PTL configuration.
 * Useful for IDE integration and documentation.
 */

/**
 * JSON Schema for PTL configuration
 */
export const PTL_CONFIG_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://ptl.dev/schema/config.json',
  title: 'PTL Configuration',
  description: 'Configuration file for Probabilistic Type Lattice (PTL)',
  type: 'object',
  properties: {
    version: {
      type: 'integer',
      const: 1,
      description: 'Configuration version (always 1)',
    },
    root: {
      type: 'string',
      description: 'Project root directory',
    },
    tsconfig: {
      type: 'string',
      description: 'Path to tsconfig.json',
    },
    lattice: {
      type: 'object',
      description: 'Type lattice configuration',
      properties: {
        includeStdlib: {
          type: 'boolean',
          default: true,
          description: 'Include TypeScript standard library types',
        },
        includeDom: {
          type: 'boolean',
          default: false,
          description: 'Include DOM types',
        },
        maxDepth: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 15,
          description: 'Maximum lattice depth for type hierarchies',
        },
      },
      additionalProperties: false,
    },
    bayesian: {
      type: 'object',
      description: 'Bayesian inference configuration',
      properties: {
        defaultAlpha: {
          type: 'number',
          exclusiveMinimum: 0,
          default: 1.0,
          description: 'Default Dirichlet prior alpha (concentration parameter)',
        },
        smoothing: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.1,
          description: 'Laplace smoothing factor',
        },
        minConfidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          default: 0.6,
          description: 'Minimum confidence threshold for type inference',
        },
        maxAlternatives: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          default: 5,
          description: 'Maximum number of type alternatives to track',
        },
        useTypePriors: {
          type: 'boolean',
          default: true,
          description: 'Use type priors from pre-trained data',
        },
        priorsPath: {
          type: 'string',
          description: 'Path to custom type priors file',
        },
      },
      additionalProperties: false,
    },
    incremental: {
      type: 'object',
      description: 'Incremental analysis configuration',
      properties: {
        enabled: {
          type: 'boolean',
          default: true,
          description: 'Enable incremental mode',
        },
        maxPropagationDepth: {
          type: 'integer',
          minimum: 0,
          default: 3,
          description: 'Maximum depth for propagating type changes',
        },
        debounceDelay: {
          type: 'integer',
          minimum: 0,
          default: 100,
          description: 'Debounce delay for file changes (ms)',
        },
        trackDependencies: {
          type: 'boolean',
          default: true,
          description: 'Enable dependency tracking',
        },
      },
      additionalProperties: false,
    },
    analyzer: {
      type: 'object',
      description: 'Analyzer configuration',
      properties: {
        include: {
          type: 'array',
          items: { type: 'string' },
          default: ['**/*.ts', '**/*.tsx'],
          description: 'File patterns to include',
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          default: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
          description: 'File patterns to exclude',
        },
        includePrivate: {
          type: 'boolean',
          default: false,
          description: 'Analyze private class members',
        },
        maxFileSize: {
          type: 'integer',
          minimum: 1,
          default: 1048576,
          description: 'Maximum file size to analyze (bytes)',
        },
        parseJsDoc: {
          type: 'boolean',
          default: true,
          description: 'Parse JSDoc comments for type hints',
        },
      },
      additionalProperties: false,
    },
    output: {
      type: 'object',
      description: 'Output configuration',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'sarif', 'text', 'markdown'],
          default: 'json',
          description: 'Output format',
        },
        file: {
          type: 'string',
          description: 'Output file path (stdout if not specified)',
        },
        includeSnippets: {
          type: 'boolean',
          default: true,
          description: 'Include source code snippets',
        },
        maxAlternatives: {
          type: 'integer',
          minimum: 1,
          default: 3,
          description: 'Maximum number of type alternatives to show',
        },
        showConfidenceIntervals: {
          type: 'boolean',
          default: true,
          description: 'Show confidence intervals',
        },
      },
      additionalProperties: false,
    },
    cache: {
      type: 'object',
      description: 'Cache configuration',
      properties: {
        enabled: {
          type: 'boolean',
          default: true,
          description: 'Enable caching',
        },
        directory: {
          type: 'string',
          default: '.ptl-cache',
          description: 'Cache directory path',
        },
        ttl: {
          type: 'integer',
          minimum: 1,
          default: 86400,
          description: 'Cache TTL in seconds',
        },
        maxSize: {
          type: 'integer',
          minimum: 1,
          default: 104857600,
          description: 'Maximum cache size in bytes',
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

/**
 * Get the JSON Schema for PTL configuration
 */
export function getConfigSchema(): typeof PTL_CONFIG_SCHEMA {
  return PTL_CONFIG_SCHEMA;
}

/**
 * Generate a sample configuration file
 *
 * @param format - Output format ('json' or 'commented')
 * @returns Sample configuration string
 */
export function generateSampleConfig(format: 'json' | 'commented' = 'commented'): string {
  const sample = {
    version: 1,
    lattice: {
      includeStdlib: true,
      includeDom: false,
      maxDepth: 15,
    },
    bayesian: {
      defaultAlpha: 1.0,
      smoothing: 0.1,
      minConfidence: 0.6,
      maxAlternatives: 5,
      useTypePriors: true,
    },
    incremental: {
      enabled: true,
      maxPropagationDepth: 3,
      debounceDelay: 100,
    },
    analyzer: {
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
      includePrivate: false,
      parseJsDoc: true,
    },
    output: {
      format: 'json',
      includeSnippets: true,
      maxAlternatives: 3,
      showConfidenceIntervals: true,
    },
    cache: {
      enabled: true,
      directory: '.ptl-cache',
      ttl: 86400,
    },
  };

  if (format === 'json') {
    return JSON.stringify(sample, null, 2);
  }

  // Commented format
  return `{
  // PTL Configuration
  // See: https://ptl.dev/docs/configuration
  
  // Configuration version (always 1)
  "version": 1,

  // Type Lattice Configuration
  "lattice": {
    // Include TypeScript standard library types
    "includeStdlib": true,
    
    // Include DOM types (for browser projects)
    "includeDom": false,
    
    // Maximum depth for type hierarchies
    "maxDepth": 15
  },

  // Bayesian Inference Configuration
  "bayesian": {
    // Dirichlet prior concentration parameter
    // Higher = stronger prior, slower learning
    "defaultAlpha": 1.0,
    
    // Laplace smoothing to prevent zero probabilities
    "smoothing": 0.1,
    
    // Minimum confidence threshold for type inference
    "minConfidence": 0.6,
    
    // Maximum type alternatives to track
    "maxAlternatives": 5,
    
    // Use pre-trained type priors
    "useTypePriors": true
  },

  // Incremental Analysis Configuration
  "incremental": {
    // Enable incremental mode
    "enabled": true,
    
    // Maximum depth for propagating type changes
    "maxPropagationDepth": 3,
    
    // Debounce delay for file changes (ms)
    "debounceDelay": 100
  },

  // Analyzer Configuration
  "analyzer": {
    // File patterns to include
    "include": ["**/*.ts", "**/*.tsx"],
    
    // File patterns to exclude
    "exclude": ["**/node_modules/**", "**/dist/**", "**/*.d.ts"],
    
    // Analyze private class members
    "includePrivate": false,
    
    // Parse JSDoc for type hints
    "parseJsDoc": true
  },

  // Output Configuration
  "output": {
    // Output format: json, sarif, text, markdown
    "format": "json",
    
    // Include source code snippets
    "includeSnippets": true,
    
    // Show confidence intervals
    "showConfidenceIntervals": true
  },

  // Cache Configuration
  "cache": {
    // Enable caching
    "enabled": true,
    
    // Cache directory
    "directory": ".ptl-cache",
    
    // Cache TTL in seconds (24 hours)
    "ttl": 86400
  }
}`;
}
