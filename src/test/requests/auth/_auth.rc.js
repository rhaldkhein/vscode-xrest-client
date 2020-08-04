module.exports = $ => {

  // Consider `data.title` is where the token is placed
  // in request `jsonplaceholder.typicode.com/todos/10`
  var token = $('data.title', 'jsonplaceholder.typicode.com/todos/10')

  return {
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Custom': $('foo')
    }
  }
}