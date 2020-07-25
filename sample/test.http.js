
// Axios config here
module.exports = () => {
  return {
    url: 'http://fakeapi.jsonparseronline.com/users?_page=1&_limit=3',
    data: {
      a: undefined,
      b: null,
      c: 'hello world',
      d: new Date(),
      e: 123,
      f: { a: 4 },
      g: [5, 'abc', undefined, true],
      h: true,
      i: false,
    }
  };
};
