
exports.get = $ => ({
  url: '/todos/1',
  params: {
    foo: $('foo')
  }
})
