/* eslint-disable @typescript-eslint/semi */
(function ({ el, list, setStyle, setAttr, mount }, vscode, cn) {

  /**
   * Helpers
   */

  function send(command, data) { vscode.postMessage({ command, data }) }
  function log(...data) {
    send('log', data.map(d => typeof d === 'string' ? d : JSON.stringify(d)))
  }

  /**
   * Components
   */

  class Button {
    constructor({ id, text, toggle, onclick }) {
      this.id = id
      this.toggle = toggle
      this.el = el('button', {
        class: cn({ 'toggle': this.toggle }),
        onclick: () => onclick(id)
      }, text)
    }
    selected(yes) {
      setAttr(this.el, {
        class: cn({ 'toggle': this.toggle }, { 'selected': yes })
      })
    }
  }

  class RequestBar {
    constructor() {
      this.el = el('div.flex items-center mb1',
        el('div.pv1 ph2 bg-sidebar br2 mr2', 'GET'),
        el('div.word-wrap', 'http://www.google.com')
      )
    }
  }

  class StatusBar {
    constructor() {
      this.el = el('div.pv1 ph2 bg-sidebar br2 mb3 flex justify-between',
        el('div', '200 OK'),
        el('div', '200 ms')
      )
    }
  }

  class BodyTabs {
    constructor({ onchange, onraw }) {
      this.tabs = [
        new Button({ id: 'req-params', text: 'Params', onclick: onchange }),
        new Button({ id: 'req-body', text: 'Body', onclick: onchange }),
        new Button({ id: 'req-headers', text: 'Headers', onclick: onchange }),
        new Button({ id: 'res-body', text: 'Body', onclick: onchange }),
        new Button({ id: 'res-headers', text: 'Headers', onclick: onchange })
      ]
      this.el = el('div.flex justify-between',
        el('div',
          el('div.mb1', 'REQUEST'),
          el('div.mb1', this.tabs[0], this.tabs[1], this.tabs[2])
        ),
        el('div',
          el('div.mb1', 'RESPONSE'),
          el('div.mb1',
            this.raw = new Button({
              id: 'raw', text: 'Raw', toggle: true, onclick: onraw
            }),
            this.tabs[3], this.tabs[4]
          )
        )
      )
      this.raw.selected(true)
    }
    changeTab(current) {
      this.tabs.forEach(t => t.selected(current === t.id))
    }
    changeRaw(raw) {
      this.raw.selected(raw)
    }
  }

  class Header {

  }

  class Headers {

  }

  class Body {

  }

  class Response {
    constructor() {

      this.data = {
        currTab: 'res-body',
        showRaw: false
      }

      this.el = el('div.dn',
        el('div.ph3 pt3 pb2 fixed bg-editor z-1 top-0 left-0 right-0',
          this.request = new RequestBar(),
          this.status = new StatusBar(),
          this.tabs = new BodyTabs({
            onchange: (tab) => {
              this.data.currTab = tab
              this.tabs.changeTab(this.data.currTab)
              this.updateBody()
            },
            onraw: () => {
              this.data.showRaw = !this.data.showRaw
              this.tabs.changeRaw(this.data.showRaw)
              this.updateBody()
            }
          })
        ),
        el('div.main-container ph3 pv2',
          'Body'
        )
      )

      this.tabs.changeTab(this.data.currTab)
      this.tabs.changeRaw(this.data.showRaw)
      this.updateBody()

    }
    updateBody() {
      // Update body based on data
      log(this.data)
    }
  }


  class App {
    constructor() {
      this.el = el('div',
        this.screens = [
          el('div.dn pa3', 'Error'),
          el('div.dn pa3', 'Requesting'),
          new Response()
        ]
      )
    }
    showScreen(screen) {
      this.screens.forEach((s, i) => {
        setStyle(s, { display: i === screen ? 'block' : 'none' })
      })
    }
  }

  /**
   * Listeners
   */

  window.addEventListener('message', ({ data: { command, data } }) => {
    command = 'response'
    switch (command) {
      case 'request':
        app.showScreen(1)
        break;
      case 'response':
        app.showScreen(2)
        break;
      default:
        app.showScreen(0)
    }
  })

  /**
   * App
   */

  const app = new App()
  mount(document.body, app)
  send('init')
  // log(document.getElementById('root').outerHTML)

})(redom, acquireVsCodeApi(), classNames)

/*
el('iframe', {
  srcdoc: '<html><body>Hello, <b>world</b>.</body></html>',
  style: 'background-color: #fff;'
})
*/