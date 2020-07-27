// tslint:disable no-var-requires no-console
import axios, { AxiosResponse } from 'axios'
import path = require('path')
import { glob } from 'glob'
import _defaults from 'lodash.defaults'

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

const file = process.argv[2]
const request = require(file)
let commons: any = {}

// Compile common js files
const startDir = path.resolve(path.dirname(file), '../..')
const files = glob.sync(startDir + '/**/.req.js')
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

// Execute request
axios(requestConfig)
  .then(print)
  .catch(err => {
    if (err.response) {
      print(err.response)
    } else {
      printError(err)
    }
  })
