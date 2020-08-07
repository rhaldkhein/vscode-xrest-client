import * as vscode from 'vscode'
import { exec, ChildProcess } from 'child_process'
import Response from './Response'
import config from './config'

export default class Request {

  private _context: vscode.ExtensionContext
  private _regexSupportedFile: RegExp
  private _requestProcess: ChildProcess | undefined
  private _checkProcess: ChildProcess | undefined
  private _responseManager: Response
  private _output: vscode.OutputChannel
  private _command: string | undefined
  private _arg: any
  private _fileName: string | undefined
  private _method: string | undefined

  constructor(context: vscode.ExtensionContext) {
    this._context = context
    this._regexSupportedFile = /.+[^\\\/]\.req\.js$/i
    this._responseManager = new Response(
      (cmd: string, data: any) => {
        if (cmd === 'refresh') {
          this.resend()
        }
      }
    )
    this._output = vscode.window.createOutputChannel(config.name)
  }

  public async resend():
    Promise<void> {

    if (this._command) {
      this._execute()
    }
  }

  public async send(
    command: string,
    arg: any = {}):
    Promise<void> {

    this._method = undefined
    this._command = command
    this._arg = arg
    // Execute request and display to webview panel
    const requestEditor = vscode.window.activeTextEditor
    const fileName = requestEditor?.document.fileName
    if (fileName && this._regexSupportedFile.test(fileName)) {
      this._fileName = fileName
      this._execute(requestEditor)
      return
    }
    this._command = undefined
    this._arg = undefined
    this._fileName = undefined
    // Not handled, show error message
    vscode.window.showErrorMessage('Please select *.req.js file')
  }

  public async _execute(
    requestEditor?: vscode.TextEditor):
    Promise<void> {

    if (!this._fileName || !this._command) return

    // Cancel previous process
    await this._cancel()

    let method = this._method || this._arg.method || 'none'

    if (method === 'none') {
      // Check file first for multi or single request
      const methods = await this._check(this._fileName)
      if (methods.length && methods.indexOf('url') === -1) {
        try {
          method = await this._pickMethod(methods)
          this._method = method
        } catch (error) {
          return
        }
      }
    }

    await this._responseManager.prepare(
      this._command,
      this._context.extensionPath,
      !requestEditor
    )

    const workspace = vscode.workspace.getWorkspaceFolder(
      vscode.Uri.file(this._fileName)
    )?.uri.fsPath || ''

    const parts = [
      `"${process.argv[0]}"`,
      `"${__dirname}/scripts/request"`,
      `"${this._fileName}"`,
      `"${this._command}"`,
      `"${workspace}"`,
      `"${method}"`
    ]

    // Execute new request
    this._requestProcess = exec(
      parts.join(' '),
      {
        // Added extra margin of 100%
        maxBuffer: config.bufferLimit * 2
      },
      async (err: any, stdout, stderr) => {
        // Return back the focus to request file
        requestEditor?.show(requestEditor.viewColumn || 0)
        // Handle error from request file
        if (stderr) {
          try {
            err = JSON.parse(stderr)
          } catch (error) {
            err = new Error(stderr.substring(0, 300))
          }
        }
        // Handle any local error
        if (err) {
          // Cancelled process
          // #TODO improve, hacky way to check killed process
          if (err.message.indexOf('Command failed:') > -1) return
          // Show error
          this._responseManager.error(err)
          this._output.appendLine(err && err.message)
          return
        }
        // Try to display response
        try {
          const data = JSON.parse(stdout)
          if (data.command === 'show_last') {
            this._responseManager.loadLast(data.request)
          } else {
            this._responseManager.success(data)
          }
        } catch (err) {
          this._responseManager.error(err)
          // tslint:disable-next-line: no-console
          this._output.appendLine(err.message)
        }
        this._checkProcess = undefined
        this._requestProcess = undefined
      }
    )
  }

  private async _check(
    fileName: string):
    Promise<string[]> {

    return new Promise((resolve, reject) => {
      const parts = [
        `"${process.argv[0]}"`,
        `"${__dirname}/scripts/check"`,
        `"${fileName}"`
      ]
      this._checkProcess = exec(
        parts.join(' '),
        async (err: any, stdout) => {
          try {
            if (stdout) return resolve(JSON.parse(stdout))
            throw (err || new Error('No check output'))
          } catch (error) {
            reject(err)
          }
        }
      )
    })
  }

  private async _pickMethod(methods: string[]):
    Promise<string> {

    return new Promise((resolve, reject) => {
      if (methods.length === 1) {
        resolve(methods[0])
        return
      }
      const quickPick = vscode.window.createQuickPick()
      quickPick.items = methods.map(method => {
        return {
          method,
          label: method
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
      if (this._requestProcess && this._checkProcess) {
        this._requestProcess.kill()
        this._requestProcess = undefined
        this._checkProcess.kill()
        this._checkProcess = undefined
        setTimeout(() => resolve(), 100)
      } else if (this._requestProcess && !this._checkProcess) {
        this._requestProcess.kill()
        this._requestProcess = undefined
        setTimeout(() => resolve(), 100)
      } else if (!this._requestProcess && this._checkProcess) {
        this._checkProcess.kill()
        this._checkProcess = undefined
        setTimeout(() => resolve(), 100)
      } else {
        resolve()
      }
    })
  }

}
