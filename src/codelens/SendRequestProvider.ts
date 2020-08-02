import * as vscode from 'vscode'

export default class SendRequestProvider
  implements vscode.CodeLensProvider {

  private _reLine: RegExp
  private _codeLenses: vscode.CodeLens[] = []
  private _reMethod: RegExp
  private _reClean: RegExp

  constructor() {
    // this._regex = /module\.exports/i
    this._reLine = /(module|exports)\.[^=.]+=/ig
    this._reMethod = /\.[^=.]*=/i
    this._reClean = /\s|\.|=/ig
  }

  public provideCodeLenses(
    document: vscode.TextDocument):
    vscode.CodeLens[] {

    this._codeLenses = []
    const regex = new RegExp(this._reLine)
    const text = document.getText()
    let matches
    // tslint:disable-next-line: no-conditional-assignment
    while ((matches = regex.exec(text)) !== null) {
      const line = document.lineAt(document.positionAt(matches.index).line)
      const indexOf = line.text.indexOf(matches[0])
      const position = new vscode.Position(line.lineNumber, indexOf)
      const range = document.getWordRangeAtPosition(
        position, new RegExp(this._reLine))
      if (range) {
        const cl: any = new vscode.CodeLens(range)
        cl.match = matches[0]
        this._codeLenses.push(cl)
      }
    }
    return this._codeLenses
  }

  public resolveCodeLens(
    codeLens: any):
    vscode.CodeLens {

    // const match: string = codeLens.match.replace(this._reClean, '')
    // Get method name
    const method: string | undefined = ((
      codeLens.match.match(this._reMethod) || []
    )[0] || '').replace(this._reClean, '')

    codeLens.command = {
      title: 'Send Request',
      command: 'vscode-xrest-client.sendRequest',
      arguments: [{
        scheme: 'codelens',
        method: method === 'exports' ? 'none' : method
      }]
    }
    return codeLens
  }

  // public provideCodeLenses(
  //   doc: TextDocument):
  //   CodeLens[] {

  //   const matches = this._regex.exec(doc.getText())
  //   if (matches) {
  //     const line = doc.lineAt(doc.positionAt(matches.index).line)
  //     const range = doc.getWordRangeAtPosition(
  //       new Position(line.lineNumber, 0),
  //       this._regex
  //     )
  //     if (range) {
  //       const codeLens = new CodeLens(range)
  //       return [codeLens]
  //     }
  //   }
  //   return []
  // }

  // public resolveCodeLens(
  //   codeLens: CodeLens):
  //   CodeLens {

  //   codeLens.command = {
  //     title: 'Send Request',
  //     command: 'vscode-xrest-client.sendRequest'
  //   }
  //   return codeLens
  // }



}
