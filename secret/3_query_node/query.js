const {
  CosmWasmClient,
} = require('secretjs');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Secret Network node
  const client = new CosmWasmClient(process.env.SECRET_REST_URL);

  // 1. Query node info
  const nodeInfo = await client.restClient.nodeInfo()
    .catch((err) => { console.error('Could not fetch node info:\n', err); });
  console.log('Node Info: ', nodeInfo);

  // 2.1 Query latest blocks
  const blocksLatest = await client.restClient.blocksLatest()
    .catch((err) => { console.error('Could not fetch latest block:\n', err); });
  console.log('Latest block: ', blocksLatest);

  // 2.2 Block by number, defaults to latest, lets get block 42
  const blocks = await client.restClient.blocks(42)
    .catch((err) => { console.error('Could not fetch block:\n', err); });
  console.log('Blocks: ', blocks);

  // 3. Query account
  const account = await client.getAccount(process.env.ADDRESS)
    .catch((err) => { console.error('Could not fetch account:\n', err); });
  console.log('Account: ', account);
};

main().then((resp) => {
  console.log(resp);
}).catch((err) => {
  console.log(err);
});
