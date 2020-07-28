import RequestView from './view/RequestView'

class Response {

  public async prepare(path: string): Promise<void> {
    RequestView.createOrShow(path)
    await RequestView.currentView?.displayLoading()
  }

  public async success(response: any): Promise<void> {
    RequestView.currentView?.displayResponse(response)
  }

  public async error(err: any): Promise<void> {
    RequestView.currentView?.displayError(err)
  }

}

export default Response