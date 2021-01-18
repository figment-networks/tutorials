// Load SecretJS components
const { CosmWasmClient } = require('secretjs');

// Load environment variables
require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Secret Network node
  const client = new CosmWasmClient(process.env.SECRET_REST_URL);

  // Query chain ID
  const chainId = await client.getChainId()
    .catch((err) => { throw new Error(`Could not get chain id: ${err}`); });

  // Query chain height
  const height = await client.getHeight()
    .catch((err) => { throw new Error(`Could not get block height: ${err}`); });

  console.log('ChainId:', chainId);
  console.log('Block height:', height);

  console.log('Successfully connected to Secret Network');
};

main().catch((err) => {
  console.error(err);
});
