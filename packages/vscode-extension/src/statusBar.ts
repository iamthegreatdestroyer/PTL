/**
 * Status Bar Manager
 *
 * Manages the PTL status bar item.
 */

import * as vscode from 'vscode';

type StatusState = 'ready' | 'analyzing' | 'error' | 'disabled';

/**
 * Manages the status bar item
 */
export class StatusBarManager implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private state: StatusState = 'ready';

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    this.statusBarItem.command = 'ptl.analyze';
    this.setReady();
    this.statusBarItem.show();
  }

  /**
   * Set status to ready
   */
  setReady(): void {
    this.state = 'ready';
    this.statusBarItem.text = '$(check) PTL';
    this.statusBarItem.tooltip = 'PTL - Click to analyze';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Set status to analyzing
   */
  setAnalyzing(): void {
    this.state = 'analyzing';
    this.statusBarItem.text = '$(sync~spin) PTL';
    this.statusBarItem.tooltip = 'PTL - Analyzing...';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Set status to error
   */
  setError(message: string): void {
    this.state = 'error';
    this.statusBarItem.text = '$(error) PTL';
    this.statusBarItem.tooltip = `PTL - ${message}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }

  /**
   * Set status to disabled
   */
  setDisabled(): void {
    this.state = 'disabled';
    this.statusBarItem.text = '$(circle-slash) PTL';
    this.statusBarItem.tooltip = 'PTL - Disabled';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Get current state
   */
  getState(): StatusState {
    return this.state;
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
