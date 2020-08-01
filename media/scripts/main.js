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
    return getHeaderValue(headers, 'content-type') || ''
  }

  function getHeaderValue(headers, key) {
    for (const k in headers) {
      if (k.toLowerCase() === key) return headers[k]
    }
  }

  function isForEditor(contentType) {
    return !(reIsImage.test(contentType) || reIsVideo.test(contentType))
  }

  function getUrl({ url, baseURL }) {
    return url.indexOf('://') > -1 ? url : (baseURL + url)
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
        this.status = el('div', ''),
        el('div',
          this.time = el('span', ''),
          el('span', ' / '),
          this.bytes = el('span', '')
        )
      )
    }
    response(res) {
      const s = res.status
      const bytes = getHeaderValue(res.headers, 'content-length') || res.bytes || 0
      this.status.textContent = s + ' ' + codes[s]
      this.time.textContent = res.time + ' ms'
      this.bytes.textContent = bytes >= 1000 ?
        (Math.round((bytes / 1000)) + ' KB') :
        (bytes + ' bytes')
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
      this.el = el('div.dn ph3',
        el('table.w-100', { cellspacing: 0 },
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
      this.el = el('div.dn ph3',
        this.image = el('img')
      )
    }
    setImage(ctype, data) {
      setAttr(this.image, { src: 'data:' + ctype + ';base64,' + data })
    }
  }

  class LargeBody {
    constructor(res) {
      this.el = el('div.dn ph3',
        'Too large to display the data. ',
        this.link = el('a', 'Click here'),
        ' to view in another application.'
      )
    }
    setResponse(res) {
      setAttr(this.link, { href: getUrl(res.config) })
    }
  }

  class OtherBody {
    constructor() {
      this.el = el('div.dn ph3', 'Content type not supported for display')
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
        new LargeBody(),
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
      const res = this.response
      const { currTab: tab, showRaw: raw } = this.data
      let forEditor = false
      let contType = null
      let contData = null

      if (tab === 'req-params') {
        forEditor = true
      } else if (tab === 'req-body') {
        contType = getContentType(res.config.headers)
        contData = res.config.data
        forEditor = isForEditor(contType)
      } else if (tab === 'res-body') {
        contType = getContentType(res.headers)
        contData = res.data
        forEditor = isForEditor(contType)
      }

      if (raw) {
        forEditor = true
      }

      if (forEditor && (tab === 'req-headers' || tab === 'res-headers')) {
        forEditor = false
      }


      // Handle too large
      if (res.large && tab === 'res-body') {
        this.bodies[2].setResponse(res)
        showEditor(false)
        this.bodies.forEach(b => hide(b.el))
        show(this.bodies[2].el)
        return
      }

      showEditor(forEditor)
      this.bodies.forEach(b => hide(b.el))

      if (forEditor) {
        hide(this.container)
        editor.setValue('')
        if (tab === 'req-params') {
          editor.setOption('mode', modes.json)
          editor.setOption('lineWrapping', false)
          editor.setValue(JSON.stringify(res.config.params, null, 2))
        } else if (tab.endsWith('-body')) {
          if (!raw && reIsJson.test(contType)) {
            editor.setOption('mode', modes.json)
            editor.setOption('lineWrapping', false)
            editor.setValue(JSON.stringify(
              typeof contData === 'string' ? JSON.parse(contData) : contData,
              null, 2))
          } else {
            editor.setOption('mode', modes.none)
            editor.setOption('lineWrapping', true)
            editor.setValue(
              typeof contData === 'string' ? contData : JSON.stringify(contData)
            )
          }
        }
      } else {
        show(this.container)
        if (tab.endsWith('-headers')) {
          show(this.bodies[0].el)
          this.bodies[0].setHeaders(tab === 'res-headers' ?
            res.headers :
            res.config.headers
          )
        } else if (reIsImage.test(contType)) {
          show(this.bodies[1].el)
          this.bodies[1].setImage(contType, contData)
        } else {
          show(this.bodies[3].el)
        }
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