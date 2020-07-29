/* eslint-disable @typescript-eslint/semi */
(function ({ el, list, place, mount }, vscode) {

  /**
   * Helpers
   */

  function send(command, data) {
    vscode.postMessage({ command, data })
  }

  /**
   * Components
   */

  class App {
    constructor() {
      this.el = el('div', 'Hello World')
    }
    request(data) {
      this.el.textContent = 'Requesting'
    }
    response(data) {
      this.el.textContent = 'Response'
    }
    error(data) {
      this.el.textContent = 'Error'
    }
  }

  /**
   * Listeners
   */

  window.addEventListener('message', ({ data: { command, data } }) => {
    switch (command) {
      case 'request':
        app.request(data)
        break;
      case 'response':
        app.response(data)
        break;
      default:
        app.error(data)
    }
  })

  /**
   * App
   */
  const app = new App()

  mount(document.body, app)

  send('init')

})(redom, acquireVsCodeApi())
