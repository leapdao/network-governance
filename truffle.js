require('babel-register');
require('babel-polyfill');


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 9000,
      gas: 4500000,
      network_id: "*" // Match any network id
    }
  }
};
