/**
 * PTL VS Code Extension
 *
 * Main extension entry point.
 */

import * as vscode from 'vscode';

import { PTLExtension } from './PTLExtension';

let extension: PTLExtension | undefined;

/**
 * Activate the extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('PTL extension activating...');

  try {
    extension = new PTLExtension(context);
    await extension.activate();

    console.log('PTL extension activated successfully');
  } catch (error) {
    console.error('Failed to activate PTL extension:', error);
    void vscode.window.showErrorMessage(
      `Failed to activate PTL extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Deactivate the extension
 */
export async function deactivate(): Promise<void> {
  console.log('PTL extension deactivating...');

  if (extension) {
    await extension.deactivate();
    extension = undefined;
  }

  console.log('PTL extension deactivated');
}
