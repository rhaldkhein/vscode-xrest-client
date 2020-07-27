module.exports = () => {
  return {
    url: 'http://jsonplaceholder.typicode.com/todos',
    params: {
      _page: 1,
      _limit: 3
    }
  };
};
