const { newKit } = require('@celo/contractkit');

require('dotenv').config();

let client;

const main = async () => {
  // Create connection to DataHub Celo Network node
  client = newKit(process.env.REST_URL);

  // Initialize account from our private key
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  // We need to add address to ContractKit in order to sign transactions
  client.addAccount(account.privateKey);
};

main().catch((err) => {
  console.error(err);
});

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
