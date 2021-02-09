const ContractKit = require('@celo/contractkit');
const Web3 = require('web3');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Celo Network node
  const web3 = new Web3(process.env.REST_URL);
  const client = ContractKit.newKitFromWeb3(web3);

  // Initialize account from our private key
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  // We need to add address to ContractKit in order to sign transactions
  client.addAccount(account.privateKey);

  // Get contract wrappers
  const stableToken = await client.contracts.getStableToken();
  const exchange = await client.contracts.getExchange();

  // Get cUSD balance
  const cUsdBalance = await stableToken.balanceOf(account.address);

  // Approve a user to transfer StableToken on behalf of another user.
  const approveTx = await stableToken.approve(exchange.address, cUsdBalance).send({from: account.address});
  const approveReceipt = await approveTx.waitReceipt();

  // Exchange cUSD for CELO
  const goldAmount = await exchange.quoteUsdSell(cUsdBalance);
  const sellTx = await exchange.sellDollar(cUsdBalance, goldAmount).send({from: account.address})
  const sellReceipt = await sellTx.waitReceipt();

  // Print receipts
  console.log('Approve Transaction receipt:', approveReceipt);
  console.log('Sell Transaction receipt:', sellReceipt);
};

main().catch((err) => {
  console.error(err);
});
