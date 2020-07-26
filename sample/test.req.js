module.exports = () => {
  return {
    url: 'http://fakeapi.jsonparseronline.com/users',
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
      inject: '<b>this is a bold text</b>',
    },
    params: {
      _page: 1,
      _limit: 100,
      yeah: 'nice!'
    },
    headers: {
      'x-custom': 'custom data'
    }
  };
};
