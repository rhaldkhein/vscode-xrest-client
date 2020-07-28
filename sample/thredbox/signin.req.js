module.exports = () => {
  return {
    url: 'http://localhost:8080/api/user/signin',
    method: 'post',
    data: {
      address: 'root@gmail.com',
      password: 'abcd1234',
      clientId: 'client-id',
      clientSecret: 'client-secret'
    }
  };
};
