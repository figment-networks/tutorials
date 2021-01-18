const { CosmWasmClient } = require('secretjs');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Secret Network node
  const client = new CosmWasmClient(process.env.SECRET_REST_URL);

  // Query chain ID
  const chainId = await client.getChainId()
    .catch((err) => { console.error('Could not get chain id:\n', err); });

  // Query chain height
  const height = await client.getHeight()
    .catch((err) => { console.error('Could not get block height:\n', err); });

  console.log('ChainId:', chainId);
  console.log('Block height:', height);

  console.log('Successfully connected to Secret Network');
};

main().then((resp) => {
  console.log(resp);
}).catch((err) => {
  console.log(err);
});
