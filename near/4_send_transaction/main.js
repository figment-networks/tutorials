// Load environment variables
require("dotenv").config();

// Load NEAR components
const near = require("near-api-js");

// Formatter helper for Near amounts
function formatAmount(amount) {
  return BigInt(near.utils.format.parseNearAmount(amount.toString()));
};

// Directory where Near credentials are going to be stored
const credentialsPath = "./credentials";

// Configure the keyStore to be used with the SDK
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath)

// Setup default client options
const options = {
  networkId:   process.env.NEAR_NETWORK,
  nodeUrl:     process.env.NEAR_NODE_URL,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:   process.env.NEAR_ACCOUNT,
  deps: {
    keyStore: keyStore
  }
}

// Configure transaction details
const txSender = options.accountId;
const txReceiver = "pizza.testnet";
const txAmount = formatAmount(1);

async function main() {
  // Configure the client with options and our local key store
  const client = await near.connect(options);
  const account = await client.account(txSender);
  const provider = client.connection.provider;

  // Create a simple money transfer using helper method
  console.log(`Sending money to ${txReceiver}`);

  try {
    const result = await account.sendMoney(txReceiver, txAmount);

    console.log("Creation result:", result.transaction);
    console.log("----------------------------------------------------------------");
    console.log("OPEN LINK BELOW to see transaction in NEAR Explorer!");
    console.log(`${options.explorerUrl}/transactions/${result.transaction.hash}`);
    console.log("----------------------------------------------------------------");

    setTimeout(async function() {
      console.log("Checking transaction status:", result.transaction.hash);

      const status = await provider.sendJsonRpc("tx", [result.transaction.hash, options.accountId]);
      console.log("Transaction status:", status);
    }, 5000);
  }
  catch(error) {
    console.log("ERROR:", error);
  }
};

main()
