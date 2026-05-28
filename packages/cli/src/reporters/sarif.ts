/**
 * SARIF Reporter
 *
 * Static Analysis Results Interchange Format (SARIF) output.
 * https://sarifweb.azurewebsites.net/
 */

import { Reporter } from './base.js';
import type { FileResult, AnalysisSummary, CLIOptions } from '../types.js';
import { VERSION } from '../version.js';

/**
 * SARIF 2.1.0 output reporter
 */
export class SarifReporter extends Reporter {
  async report(
    results: readonly FileResult[],
    summary: AnalysisSummary,
    _options: CLIOptions
  ): Promise<void> {
    const sarif = {
      $schema:
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'PTL',
              fullName: 'Probabilistic Type Lattice Analyzer',
              version: VERSION,
              informationUri: 'https://github.com/iamthegreatdestroyer/PTL',
              rules: this.generateRules(),
            },
          },
          results: this.generateResults(results),
          invocations: [
            {
              executionSuccessful: summary.errors === 0,
              startTimeUtc: new Date().toISOString(),
              endTimeUtc: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    console.log(JSON.stringify(sarif, null, 2));
  }

  formatFileResult(result: FileResult): string {
    return JSON.stringify(this.generateResultsForFile(result), null, 2);
  }

  private generateRules(): object[] {
    return [
      {
        id: 'PTL001',
        name: 'LowConfidenceType',
        shortDescription: { text: 'Type inferred with low confidence' },
        fullDescription: {
          text: 'A type was inferred but with low confidence. Consider adding explicit type annotations.',
        },
        defaultConfiguration: { level: 'warning' },
        helpUri: 'https://github.com/iamthegreatdestroyer/PTL/docs/rules/PTL001',
      },
      {
        id: 'PTL002',
        name: 'AmbiguousType',
        shortDescription: { text: 'Multiple types are equally likely' },
        fullDescription: {
          text: 'Multiple type candidates have similar confidence levels. The inference is ambiguous.',
        },
        defaultConfiguration: { level: 'warning' },
        helpUri: 'https://github.com/iamthegreatdestroyer/PTL/docs/rules/PTL002',
      },
      {
        id: 'PTL003',
        name: 'InferenceError',
        shortDescription: { text: 'Type inference failed' },
        fullDescription: {
          text: 'Type inference could not be completed. The code may contain errors.',
        },
        defaultConfiguration: { level: 'error' },
        helpUri: 'https://github.com/iamthegreatdestroyer/PTL/docs/rules/PTL003',
      },
    ];
  }

  private generateResults(results: readonly FileResult[]): object[] {
    const sarifResults: object[] = [];

    for (const result of results) {
      sarifResults.push(...this.generateResultsForFile(result));
    }

    return sarifResults;
  }

  private generateResultsForFile(result: FileResult): object[] {
    const sarifResults: object[] = [];

    // Low confidence inferences
    for (const inference of result.inferences) {
      const confidence = inference.confidence;
      const typeName = inference.type;
      if (confidence < 0.5) {
        sarifResults.push({
          ruleId: 'PTL001',
          level: 'warning',
          message: {
            text: `Type '${typeName}' inferred with ${Math.round(confidence * 100)}% confidence`,
          },
          locations: [],
        });
      }
    }

    // Diagnostics
    for (const diag of result.diagnostics) {
      sarifResults.push({
        ruleId: diag.severity === 'error' ? 'PTL003' : 'PTL002',
        level: diag.severity === 'error' ? 'error' : 'warning',
        message: { text: diag.message },
        locations: diag.location
          ? [
              {
                physicalLocation: {
                  artifactLocation: { uri: result.path },
                  region: {
                    startLine: diag.location.line,
                    startColumn: diag.location.column,
                  },
                },
              },
            ]
          : [],
      });
    }

    return sarifResults;
  }
}
