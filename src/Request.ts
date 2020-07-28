import * as vscode from 'vscode'
import { exec, ChildProcess } from 'child_process'
import Response from './Response'
import config from './config'

export default class Request {

  private _context: vscode.ExtensionContext
  private _regexSupportedFile: RegExp
  private _requestProcess: ChildProcess | undefined
  private _responseManager: Response
  private _output: vscode.OutputChannel

  constructor(context: vscode.ExtensionContext) {
    this._context = context
    this._regexSupportedFile = /.+[^\\\/]\.req\.js$/i
    this._responseManager = new Response()
    this._output = vscode.window.createOutputChannel(config.name)
  }

  public async send(command: string): Promise<void> {

    // Execute request and display to webview panel
    const fileName = vscode.window
      .activeTextEditor?.document.fileName
    if (fileName && this._regexSupportedFile.test(fileName)) {

      // Cancel previous request
      await this._cancel()
      await this._responseManager.prepare(
        command,
        this._context.extensionPath
      )

      const parts = [
        `"${process.argv[0]}"`,
        `"${__dirname}/scripts/request"`,
        `"${fileName}"`,
        `"${command}"`
      ]

      // Execute new request
      this._requestProcess = exec(
        parts.join(' '),
        (err: any, stdout, stderr) => {
          if (err || stderr) {
            this._responseManager.error(err || stderr)
            // tslint:disable-next-line: no-console
            this._output.appendLine((err && err.message) || stderr)
            return
          }
          try {
            const data = JSON.parse(stdout)
            if (data.command === 'show_last') {
              this._responseManager.loadLast(data.config)
            } else {
              this._responseManager.success(data)
            }
          } catch (err) {
            this._responseManager.error(err)
            // tslint:disable-next-line: no-console
            this._output.appendLine(err.message)
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
