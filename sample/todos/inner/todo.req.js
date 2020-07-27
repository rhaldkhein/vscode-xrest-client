module.exports = (config) => {
  return {
    url: 'http://jsonplaceholder.typicode.com/todos/2',
    params: {
      x: config.foo
    }
  };
};
