module.exports = $ => {

  // Consider `data.title` is where the token is placed
  // in request `jsonplaceholder.typicode.com/todos/10`
  // which is the signin request
  var token = $('data.title', 'jsonplaceholder.typicode.com/todos/10')

  // You can also replace jsonplaceholder.typicode.com/todos/10
  // with $('baseURL') + '/todos/10' which gets value from upper rc file.

  return {
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Custom': $('foo') // Get value from upper rc file
    }
  }
}