import * as path from 'path'
import * as vscode from 'vscode'
import { render } from 'ejs'
import templateLoading from './templates/loading'
import templateResponse from './templates/response'
import templateError from './templates/error'

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

  private constructor(
    panel: vscode.WebviewPanel,
    extensionPath: string) {

    this._panel = panel
    this._extensionPath = extensionPath

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is
    // closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

  }

  public displayLoading():
    void {

    this._panel.webview.html = templateLoading
  }

  public displayResponse(
    response: any):
    void {

    this._panel.webview.html = render(templateResponse, response)
  }

  public displayError(
    err: any):
    void {

    this._panel.webview.html = templateError
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

}
