const { newKit } = require('@celo/contractkit');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Celo Network node
  const client = newKit(process.env.REST_URL);
  const web3 = client.web3;

  // Initialize account from our private key
  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  // 1. Query account balances
  const accountBalances = await client.getTotalBalance(account.address)
    .catch((err) => { throw new Error(`Could not fetch account: ${err}`); });

  console.log('CELO balance: ', accountBalances.CELO.toString(10));
  console.log('cUSD balance: ', accountBalances.cUSD.toString(10));
  console.log('Locked CELO balance: ', accountBalances.lockedCELO.toString(10));
  console.log('Pending balance: ', accountBalances.pending.toString(10));

  // 2. Query node info
  const nodeInfo = await web3.eth.getNodeInfo()
    .catch((err) => { throw new Error(`Could not fetch node info: ${err}`); });
  console.log('Node Info: ', nodeInfo);

  // 3.1 Query latest block
  const blocksLatest = await web3.eth.getBlock("latest")
    .catch((err) => { throw new Error(`Could not fetch latest block: ${err}`); });
  console.log('Latest block: ', blocksLatest);

  // 3.2 Block by number, defaults to latest, lets get block 3263105
  const block = await web3.eth.getBlock(3263105)
    .catch((err) => { throw new Error(`Could not fetch block: ${err}`); });
  console.log('Block: ', block);
};

main().catch((err) => {
  console.error(err);
});
