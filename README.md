# Xrest Client

Flexible REST API testing in Visual Studio Code using **Simple Javascript** 🤘🚀  
  
[GIF HERE]  

## Features

- Create HTTP request files using simple Javascript
- Send requests directly from VS Code using [axios](https://github.com/axios/axios) under the hood
- Pretty response panel/tab view
- Import files for common config info
- Auto persist cookies
- Auto save last successful responses (200 status code)
- Auto import `*.rc.js` (common config files)
- Load saved responses
- And all features from Javascript 

## Requirements

The only requirements are to use specific file extensions.

1. `*.req.js` - for request files
2. `*.rc.js` - for common request configuration files

## Basic Usage

Dead simple example usage, with just URL.

#### 1. Create a request file.
Write the following code inside `mytodos.req.js`
```js
module.exports = 'http://jsonplaceholder.typicode.com/todos'
```
#### 2. Send the request file.
Right click anyware inside editor and select `Send Request`.
#### 3. View response panel.
A response panel/tab view will auto show and give you complete information about the request.

## Advanced Usage

Check out axios [request config](https://github.com/axios/axios#request-config) object for more information.

```js
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
```

Most common options you might need are:

* `url` - resource url
* `method` - GET, POST, PUT, PATCH, more... 
* `params` - this is the query string like `foo=bar&page=1&offset=6` 
* `data` - this is the body of POST and other method  
* `headers` - request headers

#### The `*.rc.js` files

A "Request Configuration" file holds the common data for all request files `*.req.js`.
Once you execute a request file, it will look for any configuration file and import all the data.

```js

// _common.rc.js
module.exports = {
  baseURL: 'https://myserver.com', // Auto prepend to `url`
  email: 'you@email.com',
  password: 'ssshhh',
  headers: {
    'X-Custom': 'Custom Data' // Auto merge to request
  }
}

// mytodos.req.js
module.exports = (config) => ({
  url: '/signin',
  method: 'POST',
  data: {
    email: config.email,
    password: config.password
  }
})

/*
Will request to https://myserver.com/signin 
with email, password and custom headers
*/

```
**Note:** Will also look for config files 3 levels up from request file.

-----------------------------------------------------------------------------------------------------------

## License

[MIT License](LICENSE.txt)

