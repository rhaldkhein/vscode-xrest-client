// tslint:disable no-var-requires no-console no-string-literal
import axios, { AxiosResponse } from 'axios'
import * as path from 'path'
import { glob } from 'glob'
import _defaults from 'lodash.defaultsdeep'
import CookieManager from './cookie'

function print(
  response: AxiosResponse<any>):
  void {

  const { config, status, headers, data } = response
  console.log(JSON.stringify({ config, status, headers, data }))
}

function printError(
  err: any):
  void {

  const { errno, code, message } = err
  console.error(JSON.stringify({ errno, code, message }))
}

const cookieManager = new CookieManager()
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
const cookie = cookieManager.fetch(requestConfig)
if (cookie) requestConfig.headers['Cookie'] = cookie

// Execute request
axios(requestConfig)
  .then(response => {
    cookieManager.store(response)
    print(response)
  })
  .catch(err => {
    if (err.response) {
      print(err.response)
    } else {
      printError(err)
    }
  })
