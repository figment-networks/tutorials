const ContractKit = require('@celo/contractkit');
const Web3 = require('web3');
const MetaCoin = require('./build/contracts/MetaCoin.json');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Celo Network node
  const web3 = new Web3(process.env.REST_URL);
  const client = ContractKit.newKitFromWeb3(web3);

  // Initialize account from our private key
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  // We need to add address to ContractKit in order to sign transactions
  client.addAccount(account.privateKey);

  // Check the Celo network ID
  const networkId = await web3.eth.net.getId();

  // Get the contract associated with the current network
  const deployedNetwork = MetaCoin.networks[networkId];

  // Create a new contract instance with the MetaCoin contract info
  let instance = new web3.eth.Contract(
    MetaCoin.abi,
    deployedNetwork && deployedNetwork.address
  );

  // Get balance
  let balanceBefore = await instance.methods.getBalance(account.address).call();
  console.log('Balance before:', balanceBefore);

  // Send tokens
  const recipientAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d';
  const amount = 100;

  const txObject = await instance.methods.sendCoin(recipientAddress, amount);
  let tx = await client.sendTransactionObject(txObject, { from: account.address });

  let receipt = await tx.waitReceipt();
  console.log('Sent coin smart contract call receipt: ', receipt);

  // Get balance again
  let balanceAfter = await instance.methods.getBalance(account.address).call();
  console.log('Balance after:', balanceAfter);
};

main().catch((err) => {
  console.error(err);
});
