// axios request config object
module.exports = {
  url: 'https://jsonplaceholder.typicode.com/posts',
  method: 'POST',
  headers: {
    'X-Custom-Header': 'This is a custom data'
  },
  data: {
    title: 'foo',
    body: 'bar',
    userId: 1
  }
  // params: { foo: 'bar' }
}