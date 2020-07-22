import axios, { AxiosResponse } from 'axios'

const file = process.argv[2]
// tslint:disable-next-line: no-var-requires
const config = require(file)

function print(response: AxiosResponse<any>): void {
  const { config, status, headers, data } = response
  // tslint:disable-next-line: no-console
  console.log(JSON.stringify({ config, status, headers, data }))
}

axios(config)
  .then(print)
  .catch(err => {
    if (err.response) print(err.response)
    else print(err)
  })
