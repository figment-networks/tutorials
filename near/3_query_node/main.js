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
  accountId:   process.env.NEAR_ACCOUNT,
  keyStore:    {}
}

async function main() {
  // Configure the client with options and our local key store
  const client = await near.connect(options);
  const provider = client.connection.provider;

  // Get network status
  const status = await provider.status();
  console.log("network status:", status);

  // Get the latest block
  let block = await provider.block({ finality: "final" });
  console.log("current block:", block);

  // Get the block by number
  block = await provider.block({ blockId: status.sync_info.latest_block_height });
  console.log("block by height:", block);

  // Get current network validators
  const validators = await provider.validators(block.header.height);
  console.log("network validators:", validators);

  // Get account details
  const account = await client.account(options.accountId);
  console.log("account state:", await account.state());

  // Get current gas price
  gasPrice = await provider.sendJsonRpc("gas_price", [null]);
  console.log("gas price:", gasPrice);

  // Get current gas price from the block header
  const anotherBlock = await provider.sendJsonRpc("block", { finality: "final" });
  console.log("gas price from header:", anotherBlock.header.gas_price);
}

main()
