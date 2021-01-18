const {
  CosmWasmClient,
} = require('secretjs');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Secret Network node
  const client = new CosmWasmClient(process.env.SECRET_REST_URL);

  // 1. Query node info
  const nodeInfo = await client.restClient.nodeInfo()
    .catch((err) => { throw new Error(`Could not fetch node info: ${err}`); });
  console.log('Node Info: ', nodeInfo);

  // 2.1 Query latest blocks
  const blocksLatest = await client.restClient.blocksLatest()
    .catch((err) => { throw new Error(`Could not fetch latest block: ${err}`); });
  console.log('Latest block: ', blocksLatest);

  // 2.2 Block by number, defaults to latest, lets get block 42
  const blocks = await client.restClient.blocks(42)
    .catch((err) => { throw new Error(`Could not fetch block: ${err}`); });
  console.log('Blocks: ', blocks);

  // 3. Query account
  const account = await client.getAccount(process.env.ADDRESS)
    .catch((err) => { throw new Error(`Could not fetch account: ${err}`); });
  console.log('Account: ', account);
};

main().catch((err) => {
  console.error(err);
});
