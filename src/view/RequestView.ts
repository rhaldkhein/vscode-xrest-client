// tslint:disable no-string-literal
import * as path from 'path'
import * as vscode from 'vscode'
import { renderFile } from 'ejs'
import codes from './codes'

// interface Formatter {
//   formatter: string
//   scripts: vscode.Uri[]
//   styles: vscode.Uri[]
// }

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

  private _defaultStyles: vscode.Uri[]
  private _defaultScripts: vscode.Uri[]
  private _initialized: boolean = false
  private _command: string | null = null
  private _response: any = null
  private _error: any = null

  constructor(
    panel: vscode.WebviewPanel,
    extensionPath: string) {

    this._extensionPath = extensionPath
    this._panel = panel
    this._panel.iconPath = this._getFileUri('images/logo-head-128.png')
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._defaultStyles = this._buildWebUris([
      'styles/tachyons.min.css',
      'scripts/codemirror/codemirror.min.css',
      'scripts/codemirror/addon-foldgutter.min.css',
      'styles/style.css'
    ])
    this._defaultScripts = this._buildWebUris([
      'scripts/codemirror/codemirror.min.js',
      'scripts/codemirror/addon-foldcode.min.js',
      'scripts/codemirror/addon-foldgutter.min.js',
      'scripts/codemirror/addon-brace-fold.min.js',
      'scripts/codemirror/mode-javascript.min.js',
      'scripts/classnames.js',
      'scripts/redom.js',
      'scripts/main.js'
    ])

    this._panel.webview.onDidReceiveMessage(message => {
      this._handleCommand(message.command, message.data)
    })

    this._load()

  }

  public async displayResponse(
    command: string,
    response: any):
    Promise<void> {

    this._error = null
    response.command = command
    this._command = command
    this._response = response
    if (this._initialized) {
      this._send('response', response)
    }

  }

  public async displayLoading():
    Promise<void> {

    this._command = null
    this._response = null
    this._error = null
    this._send('request')
  }

  public async displayError(
    err: any):
    Promise<void> {

    this._command = null
    this._response = null
    this._error = err
    this._send('error', { message: err.message })
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
   * Messages
   */

  private _handleCommand(command: string, data: any): void {
    switch (command) {
      case 'log':
        // tslint:disable-next-line: no-console
        console.log(...data)
        break
      case 'init':
        this._init()
        break
      default:

        break
    }
  }

  private _init(): void {
    // Display result if already received
    // or wait for result if not yet received
    this._initialized = true
    if (this._command) {
      this._send('response', this._response)
    } else if (this._error) {
      this._send('error', { message: this._error.message })
    } else {
      this._send('request')
    }
  }

  /**
   * Private
   */

  private async _load(): Promise<void> {
    if (this._initialized) return
    this._panel.webview.html = await renderFile(
      this._getPath('templates/response.ejs'),
      this._getTemplateData(),
      { cache: true }
    )
  }

  private _send(command: string, data?: any): void {
    this._panel.webview.postMessage({ command, data })
  }

  private _buildWebUris(file: string[]): vscode.Uri[] {
    return file.map(f => this._getWebUri(f))
  }

  private _getNonce(): string {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  private _getWebUri(file: string): vscode.Uri {
    return this._panel.webview.asWebviewUri(vscode.Uri.file(this._getPath(file)))
  }

  private _getFileUri(file: string): vscode.Uri {
    return vscode.Uri.file(this._getPath(file))
  }

  private _getPath(file: string): string {
    return path.join(this._extensionPath, 'media', file)
  }

  private _getTemplateData(): any {
    return {
      cspNonce: this._getNonce(),
      cspSource: this._panel.webview.cspSource,
      codes,
      styles: this._defaultStyles,
      scripts: this._defaultScripts
    }
  }

}
