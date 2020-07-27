module.exports = (config) => {
  return {
    url: '/todos/2',
    params: {
      x: config.foo
    },
    headers: {
      'x-custom': 'my data'
    }
  };
};
