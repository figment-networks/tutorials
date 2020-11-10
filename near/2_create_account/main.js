// Load environment variables
require("dotenv").config();

// Load Near SDK components
const near = require("near-api-js");
const fs = require("fs");

// Configure the irectory where Near credentials are going to be stored
const credentialsPath = "./credentials";

// Configure the keyStore to be used with the SDK
const UnencryptedFileSystemKeyStore = near.keyStores.UnencryptedFileSystemKeyStore;
const keyStore = new UnencryptedFileSystemKeyStore(credentialsPath);

// Setup default client options
const options = {
  networkId:   process.env.NEAR_NETWORK,
  nodeUrl:     process.env.NEAR_NODE_URL,
  walletUrl:   `https://wallet.${process.env.NEAR_NETWORK}.near.org`,
  helperUrl:   `https://helper.${process.env.NEAR_NETWORK}.near.org`,
  explorerUrl: `https://explorer.${process.env.NEAR_NETWORK}.near.org`,
  accountId:   "figment-learn.testnet",
  keyStore:    keyStore
}

async function main() {
  let keyPair;

  // Configure the client with options and our local key store
  const client = await near.connect(options);

  // Configure the key pair file location
  const keyRootPath = client.connection.signer.keyStore.keyDir;
  const keyFilePath = `${keyRootPath}/${options.networkId}/${options.accountId}.json`;

  // Check if the key pair exists, and create a new one if it does not
  if (!fs.existsSync(keyFilePath)) {
    console.log("Generating a new key pair")
    keyPair = near.KeyPair.fromRandom("ed25519");
  } else {
    let content = JSON.parse(fs.readFileSync(keyFilePath).toString());
    keyPair = near.KeyPair.fromString(content.private_key);

    console.log(`Key pair for account ${options.accountId} already exists, skipping creation`);
  }

  // Create a key pair in credentials directory
  await client.connection.signer.keyStore.setKey(options.networkId, options.accountId, keyPair);

  // Determine if account already exists
  try {
    await client.account(options.accountId);
    return console.log(`Sorry, account '${options.accountId}' already exists.`);
  }
  catch (e) {
    if (!e.message.includes("does not exist while viewing")) {
      throw e;
    }
  }

  // Generate a public key for account creation step
  const publicKey = keyPair.getPublicKey()

  // Create the account
  try {
    const response = await client.createAccount(options.accountId, publicKey);
    console.log(`Account ${response.accountId} for network "${options.networkId}" was created.`);
    console.log("----------------------------------------------------------------");
    console.log("OPEN LINK BELOW to see account in NEAR Explorer!");
    console.log(`${options.explorerUrl}/accounts/${response.accountId}`);
    console.log("----------------------------------------------------------------");
  }
  catch(error) {
    console.log("ERROR:", error);
  }
}

main();
