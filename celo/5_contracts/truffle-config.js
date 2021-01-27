const { newKit } = require('@celo/contractkit');

require('dotenv').config({path: '../.env'});

// Create connection to DataHub Celo Network node
const client = newKit(process.env.REST_URL);
const web3 = client.web3;

// Initialize account from our private key
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

// We need to add address to ContractKit in order to sign transactions
client.addAccount(account.privateKey);

module.exports = {
  networks: {
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    alfajores: {
      provider: client.connection.web3.currentProvider, // CeloProvider
      network_id: 44787  // latest Alfajores network id
    }
  }
};
