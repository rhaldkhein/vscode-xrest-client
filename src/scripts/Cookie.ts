import setCookieParser from 'set-cookie-parser'
import fs from 'fs-extra'
import config from '../config'
import getHost from '../utils/getHost'

class CookieManager {
  private _dir: string

  constructor() {
    this._dir = config.storagePath + '/cookies/'
  }

  public fetch(
    request: any):
    string | undefined {

    const cookieFile = this._dir + getHost(request)
    if (fs.existsSync(cookieFile)) {
      const now = new Date()
      const cookieBuffer = fs.readFileSync(cookieFile)
      let cookies: setCookieParser.Cookie[] = JSON.parse(
        cookieBuffer.toString())
      // Filter cookies
      cookies = cookies.filter(cookie => {
        if (cookie.expires) {
          return now < (new Date(cookie.expires as any))
        }
        return true
      })
      // Build cookie string
      return cookies.map(cookie => cookie.name + '=' + cookie.value).join('; ')
    }
  }

  public store(
    response: any):
    void {

    const { config, headers } = response
    // Store cookie
    if (headers.hasOwnProperty('set-cookie')) {
      const cookieFile = this._dir + getHost(config)
      let oldCookies: setCookieParser.Cookie[] = []
      if (fs.existsSync(cookieFile)) {
        oldCookies = JSON.parse(
          fs.readFileSync(cookieFile).toString())
      }
      const newCookies = setCookieParser(response)
      newCookies.forEach(cookie => {
        const i = oldCookies.findIndex(c => c.name === cookie.name)
        if (i > -1) {
          oldCookies.splice(i, 1, cookie)
        } else {
          oldCookies.push(cookie)
        }
      })
      fs.outputFile(
        cookieFile,
        JSON.stringify(oldCookies)
      )
    }
  }

}

export default CookieManager