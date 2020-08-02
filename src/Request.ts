import * as vscode from 'vscode'
import { exec, ChildProcess } from 'child_process'
import Response from './Response'
import config from './config'
import { resolve } from 'path'

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

  public async send(
    command: string,
    method: string = 'none'):
    Promise<void> {

    // Execute request and display to webview panel
    const requestEditor = vscode.window.activeTextEditor
    const fileName = requestEditor?.document.fileName
    if (fileName && this._regexSupportedFile.test(fileName)) {

      if (method === 'none') {
        // Check file first for multi or sigle request
      }

      // Cancel previous request
      await this._cancel()
      await this._responseManager.prepare(
        command,
        this._context.extensionPath
      )

      const workspace = vscode.workspace.getWorkspaceFolder(
        vscode.Uri.file(fileName)
      )?.uri.fsPath || ''

      const parts = [
        `"${process.argv[0]}"`,
        `"${__dirname}/scripts/request"`,
        `"${fileName}"`,
        `"${command}"`,
        `"${workspace}"`,
        `"${method}"`
      ]

      this._execute(parts, requestEditor)

      return
    }
    // Not handled, show error message
    vscode.window.showErrorMessage('Please select *.req.js file')
  }

  private _execute(
    parts: string[],
    editor: vscode.TextEditor | undefined):
    void {

    // Execute new request
    this._requestProcess = exec(
      parts.join(' '),
      {
        // Added extra margin of 100%
        maxBuffer: config.bufferLimit * 2
      },
      async (err: any, stdout, stderr) => {
        // Return back the focus to request file
        editor?.show(editor.viewColumn || 0)
        // Handle error from request file
        if (stderr) {
          err = JSON.parse(stderr)
          if (err.code === 'MULTI_REQUEST') {
            // Ask user to select which method and execute again
            try {
              const picked = await this._pickMethod(JSON.parse(err.message))
              parts[parts.length - 1] = picked
              await this._execute(parts, editor)
              // tslint:disable-next-line: no-empty
            } catch (error) { }
            return
          }
        }
        // Handle any local error
        if (err) {
          this._responseManager.error(err)
          this._output.appendLine(err && err.message)
          return
        }
        // Try to display response
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
  }

  private async _pickMethod(methods: string[]):
    Promise<string> {

    return new Promise((resolve, reject) => {
      const quickPick = vscode.window.createQuickPick()
      quickPick.items = methods.map(method => {
        const prts = method.split('_')
        return {
          method,
          label: (prts.shift() || '').toUpperCase() + ' : ' +
            (prts.join('_') || 'default')
        }
      })
      quickPick.onDidChangeSelection((selection: any) => {
        if (selection[0]) resolve(selection[0].method)
        quickPick.hide()
      })
      quickPick.onDidHide(() => {
        quickPick.dispose()
        reject(new Error('Closed'))
      })
      quickPick.show()
    })
  }

  private async _cancel():
    Promise<void> {

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
