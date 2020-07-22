import * as vscode from 'vscode'
import { exec } from 'child_process'
import RequestView from './view/RequestView'

export default class Request {

  private context: vscode.ExtensionContext
  private regexSupportedFiles: RegExp

  constructor(context: vscode.ExtensionContext) {
    this.context = context
    this.regexSupportedFiles = /.+\.http\.js$/i
  }

  public async send() {

    // Execute request and display to webview panel
    const fileName = vscode.window.activeTextEditor?.document.fileName
    if (fileName && this.regexSupportedFiles.test(fileName)) {

      RequestView.createOrShow(this.context.extensionPath)
      await RequestView.currentView?.displayLoading()

      exec(
        'node ' + __dirname + '/scripts/request ' + fileName,
        (err, stdout, stderr) => {
          if (err) {
            RequestView.currentView?.displayError(err)
          } else {
            try {
              RequestView.currentView?.displayResponse(
                JSON.parse(stdout || stderr))
            } catch (err) {
              RequestView.currentView?.displayError(err)
            }
          }
        }
      )

      return
    }
    // Not handled, show error message
    vscode.window.showErrorMessage('Please select *.http.js file')
  }

}
