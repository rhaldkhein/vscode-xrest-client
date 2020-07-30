// tslint:disable no-string-literal
import * as path from 'path'
import * as vscode from 'vscode'
import { renderFile } from 'ejs'
import codes from './codes'

const isImage = /image\/.+/i
const isJson = /.+\/json.*/i
const isXml = /.+\/xml.*/i
const isHtml = /.+\/html.*/i

interface Formatter {
  formatter: string
  scripts: vscode.Uri[]
  styles: vscode.Uri[]
}

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

    // const req = this._getFormatter(this._getContentType(response.config.headers))
    // const res = this._getFormatter(this._getContentType(response.headers))

    // this._panel.webview.html = await renderFile(
    //   this._getPath('templates/response.ejs'),
    //   { ...response, ...this._getTemplateData(req, res), command },
    //   { cache: true }
    // )

  }

  public async displayLoading():
    Promise<void> {

    // this._panel.webview.html = await renderFile(
    //   this._getPath('templates/loading.ejs'),
    //   this._getTemplateData(),
    //   { cache: true }
    // )
  }

  public async displayError(
    err: any):
    Promise<void> {

    // this._panel.webview.html = await renderFile(
    //   this._getPath('templates/error.ejs'),
    //   { ...this._getTemplateData(), message: err.message },
    //   { cache: true }
    // )
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
        this._init(data)
        break
      default:

        break
    }
  }

  private _init(data: any): void {
    // Display result if already received
    // or wait for result if not yet received
    this._send('request')
  }

  /**
   * Private
   */

  private async _load(): Promise<void> {
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
