import {
  CodeLensProvider,
  TextDocument,
  CodeLens,
  Range,
  Position
} from 'vscode'

export default class SendRequestProvider
  implements CodeLensProvider {

  private _regex: RegExp

  constructor() {
    this._regex = /module\.exports/i
  }

  public provideCodeLenses(
    doc: TextDocument):
    CodeLens[] {

    const matches = this._regex.exec(doc.getText())
    if (matches) {
      const line = doc.lineAt(doc.positionAt(matches.index).line)
      const range = doc.getWordRangeAtPosition(
        new Position(line.lineNumber, 0),
        this._regex
      )
      if (range) {
        const codeLens = new CodeLens(range)
        return [codeLens]
      }
    }
    return []
  }

  public resolveCodeLens(
    codeLens: CodeLens):
    CodeLens {

    codeLens.command = {
      title: 'Send Request',
      command: 'vscode-xrest-client.sendRequest'
    }
    return codeLens
  }



}
