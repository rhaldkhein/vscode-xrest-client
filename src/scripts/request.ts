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
const isfn = typeof request === 'function'
let commons: any

if (isfn) {
  commons = {}
  const startDir = path.resolve(path.dirname(file), '../..')
  const files = glob.sync(startDir + '/**/.req.js')
  files.forEach(file => {
    const value = require(file)
    commons = _defaults(
      typeof value === 'function' ? value(commons) : value,
      commons
    )
  })
}

axios.interceptors.request.use(
  (config: any) => {
    config.metadata = { ts: Date.now() }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axios(isfn ? request(commons) : request)
  .then(print)
  .catch(err => {
    if (err.response) {
      print(err.response)
    } else {
      printError(err)
    }
  })
