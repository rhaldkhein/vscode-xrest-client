// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode'
import Request from './Request'
import {
  commands,
  languages,
  ExtensionContext,
  DocumentSelector
} from 'vscode'
import SendRequestProvider from './codelens/SendRequestProvider'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext): void {

  // Create single requester per context
  const request = new Request(context)

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // tslint:disable-next-line: no-console
  console.log('Extension "vscode-xrest-client" is now active!')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    commands.registerCommand('vscode-xrest-client.sendRequest', async (arg) => {
      // The code you place here will be executed every time your command is executed
      await request.send('new_request', arg)
    })
  )

  context.subscriptions.push(
    commands.registerCommand('vscode-xrest-client.showLastResponse', async () => {
      await request.send('show_last')
    })
  )

  const docSelector: DocumentSelector = {
    language: 'javascript',
    scheme: 'file',
    pattern: '**/*.req.js'
  }

  context.subscriptions.push(
    languages.registerCodeLensProvider(
      docSelector,
      new SendRequestProvider()
    )
  )
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate(): void { }
