module.exports = () => {
  return {
    foo: 'bar',
    // Auto add to request
    baseURL: 'http://jsonplaceholder.typicode.com',
    headers: {
      'Authorization': 'Bearer a1b2c3x0y9z8'
    }
  };
};