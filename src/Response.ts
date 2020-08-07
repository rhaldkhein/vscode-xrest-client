import RequestView from './view/RequestView'
import config from './config'
import fs from 'fs-extra'
import getHostPath from './utils/getHostPath'
import Request from './Request'

class Response {

  private _dirLast: string
  private _dirSaved: string
  private _command: string = ''
  private _commandListener: (cmd: string, data?: any) => void

  constructor(commandListener: (cmd: string, data?: any) => void) {
    this._commandListener = commandListener
    this._dirLast = config.lastResPath + '/'
    this._dirSaved = config.savedResPath + '/'
  }

  public async prepare(
    command: string,
    path: string,
    dontShow?: boolean): Promise<void> {
    this._command = command
    if (!dontShow) {
      RequestView.createOrShow(path, this._commandListener)
    }
    return RequestView.currentView?.displayLoading()
  }

  public async success(response: any): Promise<void> {
    if (response.status < 300) {
      this._save(response)
    }
    this.display(response)
  }

  public async error(err: any): Promise<void> {
    return RequestView.currentView?.displayError(err)
  }

  public async display(response: any): Promise<void> {
    return RequestView.currentView?.displayResponse(this._command, response)
  }

  public async loadLast(request: any): Promise<void> {
    const lastResFile = this._dirLast + getHostPath(request)
    const exists = await fs.pathExists(lastResFile)
    if (exists) {
      const response = await fs.readFile(lastResFile)
      await this.display(JSON.parse(response.toString()))
    } else {
      this.error(new Error('No last response found'))
    }
  }

  private async _save(response: any): Promise<void> {
    const lastResFile = this._dirLast + getHostPath(response.request)
    return fs.outputFile(lastResFile, JSON.stringify(response))
  }

}

export default Response