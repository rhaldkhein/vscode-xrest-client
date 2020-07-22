const { api } = require('./test.common');

module.exports = {
  save: true,
  url: api + '/hello',
  query: {
    a: 1
  },
  headers: {
    'Foo': 'Bar'
  },
  body: 'Foo Bar'
};
