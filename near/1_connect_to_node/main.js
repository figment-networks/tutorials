// Load environment variables
require("dotenv").config();

// Load Near SDK components
const near = require("near-api-js");

// Setup default client options
const options = {
  networkId:   process.env.NEAR_NETWORK,
  nodeUrl:     process.env.NEAR_NODE_URL,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  keyStore:    {} // we will configure this later
}

async function main() {
  // Configure the client with options and our local key store
  const client = await near.connect(options);
  const provider = client.connection.provider;
  console.log("Client config:", client.config);

  // Get current node status
  const status = await provider.status();
  console.log("Status:", status);
}

main();
