const { newKit } = require('@celo/contractkit');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Celo Network node
  const client = newKit(process.env.REST_URL);
  const web3 = client.web3;

  // Query chain ID
  const chainId = await web3.eth.getChainId()
    .catch((err) => { throw new Error(`Could not get chain id: ${err}`); });

  // Query chain height
  const height = await web3.eth.getBlockNumber()
    .catch((err) => { throw new Error(`Could not get block height: ${err}`); });

  console.log('ChainId:', chainId);
  console.log('Block height:', height);

  console.log('Successfully connected to Celo Network');
};

main().catch((err) => {
  console.error(err);
});
