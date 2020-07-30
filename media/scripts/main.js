/* eslint-disable curly */
/* eslint-disable @typescript-eslint/semi */
(function ({ el, list, setStyle, setAttr, mount }, vscode, cn) {

  const reIsImage = /image\/.+/i
  const reIsVideo = /video\/.+/i
  // const reIsJson = /.+\/json.*/i
  // const reIsXml = /.+\/xml.*/i
  // const reIsHtml = /.+\/html.*/i

  /**
   * Helpers
   */

  function send(command, data) { vscode.postMessage({ command, data }) }
  function log(...data) {
    send('log', data.map(d => typeof d === 'string' ? d : JSON.stringify(d)))
  }

  function showEditor(yes) {
    document.getElementById('editor').style.display = yes ? 'block' : 'none'
  }

  function getContentType(headers) {
    for (const key in headers) {
      if (key.toLowerCase() === 'content-type') return headers[key]
    }
    return ''
  }

  function isForEditor(contentType) {
    return !(reIsImage.test(contentType) || reIsVideo.test(contentType))
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

  class HeaderItem {
    constructor() {
      this.el = el('tr',
        this.header = el('td.cell bb ph2 pv1 cyan', 'Key'),
        this.value = el('td.cell bb ph2 pv1', 'Item')
      )
    }
    update(data) {
      this.header.textContent = data.key
      this.value.textContent = data.value
    }
  }

  class HeadersBody {
    constructor() {
      this.el = el('div.dn',
        el('table.w-100 ph3',
          this.list = list('tbody', HeaderItem)
        )
      )
    }
    setHeaders(headers) {
      const arrHeaders = []
      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          const value = headers[key];
          arrHeaders.push({ key, value })
        }
      }
      this.list.update(arrHeaders)
    }
  }

  class ImageBody {
    constructor() {
      this.el = el('div.dn', 'Image/Video Body')
    }
  }

  class OtherBody {
    constructor() {
      this.el = el('div.dn', 'Other Body')
    }
  }

  class Response {
    constructor() {

      this.response = {}
      this.data = {
        currTab: 'res-body',
        showRaw: false
      }
      this.bodies = [
        new HeadersBody(),
        new ImageBody(),
        new OtherBody()
      ]

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
        el('div.main-container', this.bodies)
      )

      this.tabs.changeTab(this.data.currTab)
      this.tabs.changeRaw(this.data.showRaw)

    }
    updateBody() {

      const { currTab: tab, showRaw: raw } = this.data
      let forEditor = false
      let contType = null

      if (raw || tab === 'req-params') {
        forEditor = true
      } else if (tab === 'req-body') {
        contType = getContentType(this.response.config.headers)
        forEditor = isForEditor(contType)
      } else if (tab === 'res-body') {
        contType = getContentType(this.response.headers)
        forEditor = isForEditor(contType)
      }

      if (forEditor && (tab === 'req-headers' || tab === 'res-headers')) {
        forEditor = false
      }

      log(this.data, contType)
      showEditor(forEditor)

      this.bodies.forEach(b => setAttr(b, { class: 'dn' }))
      if (forEditor) {
        if (tab === 'req-params') {
          editor.setOption('mode', modes.json)
          editor.setValue(JSON.stringify(this.response.config.params, null, 2))
        } else if (tab === 'req-body') {
          editor.setOption('mode', modes.json)
          editor.setValue(JSON.stringify(this.response.config.data, null, 2))
        } else if (tab === 'res-body') {
          editor.setOption('mode', modes.json)
          editor.setValue(JSON.stringify(this.response.data, null, 2))
        }
      } else if (tab === 'req-headers') {
        setAttr(this.bodies[0], { class: 'db' })
        this.bodies[0].setHeaders(this.response.config.headers)
      } else if (tab === 'res-headers') {
        setAttr(this.bodies[0], { class: 'db' })
        this.bodies[0].setHeaders(this.response.headers)
      } else {
        // Image / Video / Other
      }

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
    showScreen(screen, data) {
      this.screens.forEach((s, i) => {
        setStyle(s, { display: i === screen ? 'block' : 'none' })
      })
      if (screen === 2) {
        const responseScreen = this.screens[2]
        responseScreen.response = {
          config: {
            headers: {
              'content-type': 'application/json'
            },
            params: {
              nice: 'game'
            },
            data: {
              name: 'Kevin'
            }
          },
          headers: {
            'content-type': 'image/jpeg'
            // 'content-type': 'application/json'
          },
          data: 'Image Data'
          // data: { name: 'Marian' }
        }
        responseScreen.updateBody()
      }
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
        app.showScreen(2, data)
        break;
      default:
        app.showScreen(0)
    }
  })

  /**
   * App
   */

  const app = new App()
  mount(document.body, app, document.body.firstChild)
  send('init')

  const modes = {
    none: null,
    json: { name: 'javascript', json: true }
  }

  const editor = CodeMirror(document.getElementById('editor'), {
    mode: modes.none,
    lineNumbers: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
  })

})(redom, acquireVsCodeApi(), classNames)

/*
el('iframe', {
  srcdoc: '<html><body>Hello, <b>world</b>.</body></html>',
  style: 'background-color: #fff;'
})
*/