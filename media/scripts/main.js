/* eslint-disable curly */
/* eslint-disable @typescript-eslint/semi */
(function ({ el, list, setStyle, setAttr, mount }, vscode, cn) {

  const reIsImage = /image\/.+/i
  const reIsVideo = /video\/.+/i
  const reIsJson = /.+\/json.*/i
  // const reIsXml = /.+\/xml.*/i
  // const reIsHtml = /.+\/html.*/i

  /**
   * Helpers
   */

  function setClass(el, cls) { setAttr(el, { class: cls }) }
  function addClass(el, ...cls) { el.classList.add(...cls) }
  function remClass(el, ...cls) { el.classList.remove(...cls) }
  function repClass(el, c1, c2) { el.classList.replace(c1, c2) }

  function send(command, data) { vscode.postMessage({ command, data }) }
  function log(...data) {
    send('log', data.map(d => typeof d === 'string' ? d : JSON.stringify(d)))
  }

  function show(el, d = 'block') { el.style.display = d }
  function hide(el) { show(el, 'none') }
  function showEditor(yes) {
    /**
     * A hacky way to make CodeMirror work alongside Redom. 
     * It doesn't seems to work with dynamic instantiation inside components.
     * And need to define element in ejs for CodeMirror to work. 
     */
    show(document.getElementById('editor'), yes ? 'block' : 'none')
    const elApp = document.getElementById('app')
    if (yes) remClass(elApp, 'h-100')
    else addClass(elApp, 'h-100')
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

  function getUrl({ url, baseURL }) {
    return url.indexOf('://') ? url : baseURL + url
  }

  /**
   * Components
   */

  class Button {
    constructor({ id, text, toggle, onclick, cls = '' }) {
      this.id = id
      this.toggle = toggle
      this.cls = cls
      this.el = el('button', {
        class: cls + ' ' + cn({ 'toggle': this.toggle }),
        onclick: () => onclick(id)
      }, text)
    }
    selected(yes) {
      setClass(this.el,
        this.cls + ' ' + cn({ 'toggle': this.toggle }, { 'selected': yes }))
    }
  }

  class RequestBar {
    constructor() {
      this.el = el('div.flex items-center mb1',
        this.method = el('div.pv1 ph2 bg-sidebar br2 mr2', ''),
        this.url = el('div.word-wrap', '')
      )
    }
    response(req) {
      this.method.textContent = req.method.toUpperCase()
      this.url.textContent = getUrl(req)
    }
  }

  class StatusBar {
    constructor() {
      this.el = el('div.pv1 ph2 bg-sidebar br2 mb3 flex justify-between',
        this.status = el('div', '200 OK'),
        this.time = el('div', '200 ms')
      )
    }
    response(res) {
      const s = res.status
      this.status.textContent = s + ' ' + codes[s]
      this.time.textContent = res.time + ' ms'
      setClass(this.status,
        s >= 400 ? 'error' :
          (s >= 300 ? 'warning' :
            'success')
      )
    }
  }

  class BodyTabs {
    constructor({ onchange, onraw }) {
      this.tabs = [
        new Button({
          id: 'req-params', text: 'Params', onclick: onchange, cls: 'mr1'
        }),
        new Button({
          id: 'req-body', text: 'Body', onclick: onchange, cls: 'mr1'
        }),
        new Button({
          id: 'req-headers', text: 'Headers', onclick: onchange
        }),
        new Button({
          id: 'res-body', text: 'Body', onclick: onchange, cls: 'ml1'
        }),
        new Button({
          id: 'res-headers', text: 'Headers', onclick: onchange, cls: 'ml1'
        })
      ]
      this.el = el('div.flex justify-between',
        el('div',
          el('div.mb1', 'REQUEST'),
          el('div.mb1', this.tabs[0], this.tabs[1], this.tabs[2])
        ),
        el('div',
          el('div.mb1 tr', 'RESPONSE'),
          el('div.mb1 tr',
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
        el('td.cell cell-key ph2 pv1 cyan',
          this.header = el('span', 'Key')
        ),
        el('td.cell ph2 pv1',
          this.value = el('span.word-wrap', 'Item')
        )
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
        el('table.w-100 ph3', { cellspacing: 0 },
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

      this.el = el('div.dn h-100',
        el('div.h-100 flex flex-column mh0',
          el('div.ph3 pt3 pb2 bg-editor',
            this.request = new RequestBar(),
            this.status = new StatusBar(),
            this.tabs = new BodyTabs({
              onchange: (tab) => {
                if (this.data.currTab === tab) return
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
          this.container = el('div.flex-grow-1 overflowy-auto',
            this.bodies
          )
        )
      )

      this.tabs.changeTab(this.data.currTab)
      this.tabs.changeRaw(this.data.showRaw)

    }
    updateHeadArea() {
      this.request.response(this.response.config)
      this.status.response(this.response)
    }
    updateBody() {

      this.updateHeadArea()

      const { currTab: tab, showRaw: raw } = this.data
      let forEditor = false
      let reqContType = null
      let resContType = null

      if (raw || tab === 'req-params') {
        forEditor = true
      } else if (tab === 'req-body') {
        reqContType = getContentType(this.response.config.headers)
        forEditor = isForEditor(reqContType)
      } else if (tab === 'res-body') {
        resContType = getContentType(this.response.headers)
        forEditor = isForEditor(resContType)
      }

      if (forEditor && (tab === 'req-headers' || tab === 'res-headers')) {
        forEditor = false
      }

      showEditor(forEditor)

      this.bodies.forEach(b => hide(b.el))
      if (forEditor) {
        hide(this.container)
        editor.setValue('')
        if (tab === 'req-params') {
          editor.setOption('mode', modes.json)
          editor.setOption('lineWrapping', false)
          editor.setValue(JSON.stringify(this.response.config.params, null, 2))
        } else if (tab.endsWith('-body')) {
          let ctype, data
          if (tab === 'req-body') {
            ctype = reqContType
            data = this.response.config.data
          } else {
            ctype = resContType
            data = this.response.data
          }
          if (!raw && reIsJson.test(ctype)) {
            editor.setOption('mode', modes.json)
            editor.setOption('lineWrapping', false)
            editor.setValue(JSON.stringify(
              typeof data === 'string' ? JSON.parse(data) : data,
              null, 2))
          } else {
            editor.setOption('mode', modes.none)
            editor.setOption('lineWrapping', true)
            editor.setValue(JSON.stringify(data))
          }
        }
      } else {
        show(this.container)
        if (tab.endsWith('-headers')) {
          show(this.bodies[0].el)
          this.bodies[0].setHeaders(tab === 'res-headers' ?
            this.response.headers :
            this.response.config.headers
          )
        }
        // Image / Video / Other
      }

    }
  }


  class App {
    constructor() {
      this.el = el('div.h-100',
        this.screens = [
          el('div.dn pa3', 'Something went wrong!'),
          el('div.dn pa3', 'Waiting for response ...'),
          new Response()
        ]
      )
    }
    showScreen(screen, data) {
      showEditor(false)
      this.screens.forEach((s, i) => {
        setStyle(s, { display: i === screen ? 'block' : 'none' })
      })
      if (screen === 2) {
        const responseScreen = this.screens[2]
        responseScreen.response = data
        responseScreen.updateBody()
      }
    }
  }

  /**
   * Listeners
   */

  window.addEventListener('message', ({ data: { command, data } }) => {
    switch (command) {
      case 'request':
        app.showScreen(1)
        break;
      case 'response':
        data.time = Date.now() - data.config.metadata.ts
        app.showScreen(2, data)
        break;
      default:
        app.showScreen(0, data)
    }
  })

  /**
   * App
   */

  const app = new App()
  mount(document.getElementById('app'), app)
  send('init')

  const codes = JSON.parse(
    document.getElementsByClassName('data-codes')[0].value
  )
  const modes = {
    none: null,
    json: { name: 'javascript', json: true }
  }

  const editor = CodeMirror(
    document.getElementById('editor'),
    {
      mode: modes.none,
      lineNumbers: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
    }
  )
  editor.setSize('100%', '100%')
  showEditor(false)

})(redom, acquireVsCodeApi(), classNames)

/*
el('iframe', {
  srcdoc: '<html><body>Hello, <b>world</b>.</body></html>',
  style: 'background-color: #fff;'
})
*/