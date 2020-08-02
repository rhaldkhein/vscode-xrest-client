// tslint:disable no-var-requires no-console

const file = process.argv[2]
let request = require(file)
console.log(JSON.stringify(Object.keys(request)))
