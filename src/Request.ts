import * as vscode from 'vscode'
import { exec, ChildProcess } from 'child_process'
import Response from './Response'

export default class Request {

  private _context: vscode.ExtensionContext
  private _regexSupportedFile: RegExp
  private _requestProcess: ChildProcess | undefined
  private _responseManager: Response

  constructor(context: vscode.ExtensionContext) {
    this._context = context
    this._regexSupportedFile = /.+[^\\\/]\.req\.js$/i
    this._responseManager = new Response()
  }

  public async send(): Promise<void> {

    // Execute request and display to webview panel
    const fileName = vscode.window
      .activeTextEditor?.document.fileName
    if (fileName && this._regexSupportedFile.test(fileName)) {

      // Cancel previous request
      await this._cancel()
      await this._responseManager.prepare(this._context.extensionPath)

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
            this._responseManager.error(err || stderr)
            // tslint:disable-next-line: no-console
            console.error(err || stderr)
            return
          }
          try {
            this._responseManager.success(JSON.parse(stdout))
          } catch (err) {
            this._responseManager.error(err)
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
