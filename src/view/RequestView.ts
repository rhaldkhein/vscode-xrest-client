import * as path from 'path'
import * as vscode from 'vscode'
import { renderFile } from 'ejs'
import codes from './codes'

export default class RequestView {

  /**
   * Static
   */

  public static currentView: RequestView | undefined

  public static createOrShow(
    extensionPath: string):
    void {

    const column = vscode.window.activeTextEditor?.viewColumn || 0
    // If we already have a panel, show it.
    if (RequestView.currentView) {
      RequestView.currentView._panel.reveal(column + 1)
      return
    }
    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'requestView',
      'Response',
      column + 1,
      {
        // Enable javascript in the webview
        enableScripts: true,
        // And restrict the webview to only loading content from our
        // extension's `media` directory.
        localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
      }
    )
    RequestView.currentView = new RequestView(panel, extensionPath)
  }

  /**
   * Instance
   */

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionPath: string
  private _disposables: vscode.Disposable[] = []

  private _scripts: vscode.Uri[]
  private _styles: vscode.Uri[]

  constructor(
    panel: vscode.WebviewPanel,
    extensionPath: string) {

    this._panel = panel
    this._extensionPath = extensionPath

    this._scripts = this.buildUris([
      'scripts/cash.js',
      'scripts/json-formatter.umd.js',
      'scripts/main.js'
    ])

    this._styles = this.buildUris([
      'styles/tachyons.min.css',
      'styles/json-formatter.css',
      'styles/style.css'
    ])

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is
    // closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

  }

  public async displayLoading():
    Promise<void> {

    this._panel.webview.html = await renderFile(
      path.join(this._extensionPath, 'media', 'templates/loading.ejs'),
      this.getTemplateDefaultData(),
      { cache: true }
    )
  }

  public async displayResponse(
    response: any):
    Promise<void> {

    this._panel.webview.html = await renderFile(
      path.join(this._extensionPath, 'media', 'templates/response.ejs'),
      { ...response, ...this.getTemplateDefaultData() },
      { cache: true }
    )
  }

  public async displayError(
    err: any):
    Promise<void> {

    this._panel.webview.html = await renderFile(
      path.join(this._extensionPath, 'media', 'templates/error.ejs'),
      this.getTemplateDefaultData(),
      { cache: true }
    )
  }

  public dispose():
    void {

    RequestView.currentView = undefined
    this._panel.dispose()
    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) x.dispose()
    }
  }

  /**
   * Private
   */

  private buildUris(file: string[]): vscode.Uri[] {
    return file.map(f => this.getUri(f))
  }

  private getNonce(): string {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  private getUri(file: string): vscode.Uri {
    return this._panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._extensionPath, 'media', file)
      )
    )
  }

  private getTemplateDefaultData(): any {
    return {
      scripts: this._scripts,
      styles: this._styles,
      cspNonce: this.getNonce(),
      cspSource: this._panel.webview.cspSource,
      codes
    }
  }

}
