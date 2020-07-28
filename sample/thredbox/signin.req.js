const data = require('./.ignored.json');

module.exports = () => {
  return {
    url: 'http://localhost:8080/api/user/signin',
    method: 'post',
    data: data
  };
};
