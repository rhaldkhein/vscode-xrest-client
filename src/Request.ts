import * as vscode from 'vscode'
import { exec, ChildProcess } from 'child_process'
import RequestView from './view/RequestView'

export default class Request {

  private _context: vscode.ExtensionContext
  private _regexSupportedFile: RegExp
  private _requestProcess: ChildProcess | undefined

  constructor(context: vscode.ExtensionContext) {
    this._context = context
    this._regexSupportedFile = /.+[^\\\/]\.req\.js$/i
  }

  public async send(): Promise<void> {

    // Execute request and display to webview panel
    const fileName = vscode.window
      .activeTextEditor?.document.fileName
    if (fileName && this._regexSupportedFile.test(fileName)) {

      // Cancel previous request
      await this._cancel()

      RequestView.createOrShow(this._context.extensionPath)
      await RequestView.currentView?.displayLoading()

      const parts = [
        'node',
        `"${__dirname}/scripts/request"`,
        `"${fileName}"`
      ]

      // Execute new request
      this._requestProcess = exec(
        parts.join(' '),
        (err: any, stdout, stderr) => {
          if (err || stderr) {
            RequestView.currentView?.displayError(err || stderr)
            // tslint:disable-next-line: no-console
            console.error(err || stderr)
            return
          }
          try {
            RequestView.currentView?.displayResponse(
              JSON.parse(stdout))
          } catch (err) {
            RequestView.currentView?.displayError(err)
            // tslint:disable-next-line: no-console
            console.error(err)
          }
          this._requestProcess = undefined
        }
      )

      return
    }
    // Not handled, show error message
    vscode.window.showErrorMessage('Please select *.req.js file')
  }

  private async _cancel(): Promise<void> {

    return new Promise(resolve => {
      if (this._requestProcess) {
        this._requestProcess.kill()
        this._requestProcess = undefined
        setTimeout(() => resolve(), 300)
      } else {
        resolve()
      }
    })
  }

}