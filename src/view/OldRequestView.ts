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

  private _formatters: { [name: string]: Formatter }

  constructor(
    panel: vscode.WebviewPanel,
    extensionPath: string) {

    this._extensionPath = extensionPath
    this._panel = panel
    this._panel.iconPath = this._getFileUri('images/logo-head-128.png')
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._defaultStyles = this._buildStyleWebUris([
      'formatters/json.css',
      'styles/tachyons.min.css',
      'styles/style.css'
    ])
    this._defaultScripts = this._buildScriptWebUris([
      'formatters/json.js',
      'scripts/cash.js',
      'scripts/main.js'
    ])

    this._formatters = {
      raw: {
        formatter: 'raw',
        styles: this._buildStyleWebUris([]),
        scripts: this._buildScriptWebUris([])
      },
      json: {
        // Just placeholder, json already added as default
        formatter: 'json',
        styles: this._buildStyleWebUris([]),
        scripts: this._buildScriptWebUris([])
      },
      image: {
        formatter: 'image',
        styles: this._buildStyleWebUris([]),
        scripts: this._buildScriptWebUris([])
      }
      // #ADD formatters
    }

  }

  public async displayResponse(
    command: string,
    response: any):
    Promise<void> {

    const req = this._getFormatter(this._getContentType(response.config.headers))
    const res = this._getFormatter(this._getContentType(response.headers))

    this._panel.webview.html = await renderFile(
      this._getPath('templates/response.ejs'),
      { ...response, ...this._getTemplateData(req, res), command },
      { cache: true }
    )

  }

  public async displayLoading():
    Promise<void> {

    this._panel.webview.html = await renderFile(
      this._getPath('templates/loading.ejs'),
      this._getTemplateData(),
      { cache: true }
    )
  }

  public async displayError(
    err: any):
    Promise<void> {

    this._panel.webview.html = await renderFile(
      this._getPath('templates/error.ejs'),
      { ...this._getTemplateData(), message: err.message },
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

  private _buildScriptWebUris(file: string[]): vscode.Uri[] {
    return file.map(f => this._getWebUri(f))
  }

  private _buildStyleWebUris(file: string[]): vscode.Uri[] {
    return file.map(f => this._getWebUri(f))
  }

  private _getContentType(headers: any): string {
    for (const key in headers) {
      if (key.toLowerCase() === 'content-type') {
        return headers[key]
      }
    }
    return ''
  }

  private _getFormatter(contentType: string): Formatter {
    if (isJson.test(contentType)) {
      return this._formatters['json']
    } else if (isImage.test(contentType)) {
      return this._formatters['image']
    }
    return this._formatters['raw']
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

  private _removeDuplicates(arr: any[]): any[] {
    return [...new Set(arr)]
  }

  private _getTemplateData(
    reqFormatter?: Formatter,
    resFormatter?: Formatter):
    any {

    // Fix duplicate formatter
    const defaultFormatter = this._formatters['raw']

    return {
      cspNonce: this._getNonce(),
      cspSource: this._panel.webview.cspSource,
      codes,
      styles: this._removeDuplicates([
        ...(reqFormatter || defaultFormatter).styles,
        ...(resFormatter || defaultFormatter).styles,
        ...this._defaultStyles
      ]),
      scripts: this._removeDuplicates([
        ...(reqFormatter || defaultFormatter).scripts,
        ...(resFormatter || defaultFormatter).scripts,
        ...this._defaultScripts
      ]),
      reqFormatter: (reqFormatter || defaultFormatter).formatter,
      resFormatter: (resFormatter || defaultFormatter).formatter
    }
  }

}
