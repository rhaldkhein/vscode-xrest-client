// tslint:disable no-var-requires no-console no-string-literal
import axios, { AxiosResponse } from 'axios'
import * as path from 'path'
import { glob } from 'glob'
import _defaults from 'lodash.defaultsdeep'
import { URL } from 'url'
import fs from 'fs-extra'
import { homedir } from 'os'
import setCookieParser from 'set-cookie-parser'

function print(response: AxiosResponse<any>): void {
  const { config, status, headers, data } = response
  console.log(JSON.stringify({ config, status, headers, data }))
}

function printError(err: any): void {
  console.error({
    errno: err.errno,
    code: err.code,
    message: err.message
  })
}

function storeResponse(
  response: any):
  void {

  const { config, headers } = response
  // Store cookie
  if (headers.hasOwnProperty('set-cookie')) {
    const cookieFile = storageDir + '/cookies/' + getHost(config)
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

function cleanHost(
  host: string):
  string {

  return host.replace('www.', '').replace(/\./g, '_')
}

function getHost(
  config: any):
  string {

  const url = new URL(
    config.url.indexOf('://') > -1 ?
      config.url : config.baseURL
  )
  return cleanHost(url.host)
}

const storageDir = homedir() + '/.xrest-client'
const file = process.argv[2]
const request = require(file)
let commons: any = {}

// Compile common js files
const currDir = path.dirname(file)
const startDir = path.resolve(currDir, '../..')
const files = glob.sync(
  startDir + '/**/*.rc.js',
  { ignore: currDir + '/*/**/*' }
)
files.forEach(file => {
  const value = require(file)
  commons = _defaults(
    typeof value === 'function' ? value(commons) : value,
    commons
  )
})

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

// Resolve request config
let requestConfig = typeof request === 'function' ? request(commons) : request

// Fix string config
if (typeof requestConfig === 'string') {
  requestConfig = { url: requestConfig }
}

// Inject base url
if (commons.baseURL) requestConfig.baseURL = commons.baseURL

// Inject common headers
if (!requestConfig.headers) requestConfig.headers = {}
_defaults(requestConfig.headers, commons.headers)

// Inject cookie
const cookieFile = storageDir + '/cookies/' + getHost(requestConfig)
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
  requestConfig.headers['Cookie'] = cookies.map(
    cookie => cookie.name + '=' + cookie.value).join('; ')
}

// Execute request
axios(requestConfig)
  .then(response => {
    storeResponse(response)
    print(response)
  })
  .catch(err => {
    if (err.response) {
      print(err.response)
    } else {
      printError(err)
    }
  })
