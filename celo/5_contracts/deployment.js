const { newKit } = require('@celo/contractkit');
const MetaCoin = require('./build/contracts/MetaCoin.json')

require('dotenv').config({path: '../.env'});

const main = async () => {
  // Create connection to DataHub Celo Network node
  const client = newKit(process.env.REST_URL);
  const web3 = client.web3;

  // Initialize account from our private key
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  // We need to add address to ContractKit in order to sign transactions
  client.addAccount(account.privateKey);

  // Create deployment transaction
  let tx = await client.connection.sendTransaction({
    from: account.address,
    data: MetaCoin.bytecode
  })

  // Wait for transaction to be processed
  const receipt = await tx.waitReceipt();

  console.log('Send deploy transaction receipt:', receipt);
};

main().catch((err) => {
  console.error(err);
});
