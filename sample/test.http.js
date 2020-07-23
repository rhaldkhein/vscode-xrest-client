const { baseUrl } = require('./test.common');

// Axios config here
module.exports = () => {
  return {
    url: baseUrl + '/todos/3',
    headers: {
      'x-custom-foo': 'value-bar'
    },
    params: {
      yay: true
    },
    data: {
      foo: 'bar',
      age: 23
    }
  };
};
