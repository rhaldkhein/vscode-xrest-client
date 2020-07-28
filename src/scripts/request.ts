// tslint:disable no-var-requires no-console no-string-literal
import axios, { AxiosResponse } from 'axios'
import * as path from 'path'
import { glob } from 'glob'
import _defaults from 'lodash.defaultsdeep'
import CookieManager from './Cookie'

function print(
  command: string,
  response: AxiosResponse<any>):
  void {

  const { config, status, headers, data } = response
  console.log(JSON.stringify({ command, config, status, headers, data }))
}

function printError(
  err: any):
  void {

  const { errno, code, message } = err
  console.error(JSON.stringify({ errno, code, message }))
}

function getCommon(): any {

  let common = {}
  const currDir = path.dirname(file)
  const startDir = path.resolve(currDir, '../..')
  const files = glob.sync(
    startDir + '/**/*.rc.js',
    { ignore: currDir + '/*/**/*' }
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
  config: any,
  common: any):
  void {

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
    .then(response => {
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

const cookieManager = new CookieManager()
const file = process.argv[2]
const command = process.argv[3]
const request = require(file)

// Resolve common config
const common = getCommon()
// Resolve request config
const config = typeof request === 'function' ? request(common) : request

// Execute request
send(command, config, common)