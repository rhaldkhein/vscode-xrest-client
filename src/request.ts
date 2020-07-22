import { request } from 'http'

const file = process.argv[2]
const config = require(file)

const req = request(config.url, (res) => {
  res.setEncoding('utf8')
  res.on('data', (chunk) => {
    console.log(chunk)
  })
  res.on('error', (err) => {
    console.log(err.message)
  })
})

req.on('error', (err) => {
  console.log(err.message)
})

req.end();