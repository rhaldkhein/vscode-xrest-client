// tslint:disable no-var-requires no-console no-string-literal
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'
import * as path from 'path'
import match from 'minimatch'
import { glob } from 'glob'
import _defaults from 'lodash.defaultsdeep'
import CookieManager from './Cookie'
import getContentType from '../utils/getContentType'
import getHeaderValue from '../utils/getHeaderValue'

const LARGE_LIMIT = 1000 * 1000 * 2 // 2MB

function print(
  command: string,
  response: AxiosResponse<any>):
  void {

  // tslint:disable-next-line: prefer-const
  let { config, status, headers, data } = response

  // Data are now always buffer
  const buffer = Buffer.from(data, 'binary')
  const ctype = getContentType(headers)
  const bytes = parseInt(
    getHeaderValue(headers, 'content-length') || '0', 10
  ) || buffer.length
  const large = bytes > LARGE_LIMIT

  if (large) {
    data = null
  } else if (match(ctype, '*(image|audio|video)/*')) {
    // Binary
    data = buffer.toString('base64')
  } else if (match(ctype, '*/json*')) {
    // JSON
    data = JSON.parse(buffer.toString())
  } else {
    // Plain Text
    data = buffer.toString()
  }

  console.log(JSON.stringify({
    command, config, status, headers, data, bytes, large
  }))
}

function printError(
  err: any):
  void {

  const { errno, code, message } = err
  console.error(JSON.stringify({ errno, code, message }))
}

function getCommon(startDir: string, file: string): any {

  let common = {}
  const currDir = path.dirname(file)
  const files = glob.sync(
    startDir + '/**/*.rc.js',
    { ignore: currDir + '/*/**/*', strict: false }
  )
  files.forEach(file => {
    const value = require(file)
    common = _defaults(
      typeof value === 'function' ? value(common) : value,
      common
    )
  })
  return common
}

function send(
  command: string,
  config: AxiosRequestConfig,
  common: any):
  void {

  const cookieManager = new CookieManager()

  // Fix string config
  if (typeof config === 'string') {
    config = { url: config }
  }

  // Inject base url
  if (common.baseURL) config.baseURL = common.baseURL

  // Cancel now, we only need url
  if (command === 'show_last') {
    print(command, { config } as any)
    return
  }

  // Inject common headers
  if (!config.headers) config.headers = {}
  _defaults(config.headers, common.headers)

  // Inject cookie
  const cookie = cookieManager.fetch(config)
  if (cookie) config.headers['Cookie'] = cookie

  config.responseType = 'arraybuffer'

  // Add metadata and other stuff before request
  axios.interceptors.request.use(
    (config: any) => {
      config.metadata = { ts: Date.now() }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axios(config)
    .then((response: any) => {
      cookieManager.store(response)
      print(command, response)
    })
    .catch(err => {
      if (err.response) {
        print(command, err.response)
      } else {
        printError(err)
      }
    })
}

try {

  const file = process.argv[2]
  const command = process.argv[3]
  const workspace = process.argv[4]
  const request = require(file)

  // Resolve common config
  const common = getCommon(workspace, file)
  // Resolve request config
  const config = typeof request === 'function' ? request(common) : request

  // Execute request
  send(command, config, common)

} catch (error) {
  printError(error)
}