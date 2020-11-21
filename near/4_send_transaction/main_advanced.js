// Load environment variables
require("dotenv").config();

// Load Near SDK components
const near = require("near-api-js");
const { sha256 } = require("js-sha256");
const fs = require("fs");

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
  const provider = client.connection.provider;

  // Private key configuration
  const keyRootPath = client.connection.signer.keyStore.keyDir;
  const keyFilePath = `${keyRootPath}/${options.networkId}/${options.accountId}.json`;

  // Load key pair from the file
  const content = JSON.parse(fs.readFileSync(keyFilePath).toString());
  const keyPair = near.KeyPair.fromString(content.private_key);

  // Get the sender public key
  const publicKey = keyPair.getPublicKey();
  console.log("Sender public key:", publicKey.toString())

  // Get the public key information from the node
  const accessKey = await provider.query(
    `access_key/${txSender}/${publicKey.toString()}`, ""
  );
  console.log("Sender access key:", accessKey);

  // Check to make sure provided key is a full access key
  if (accessKey.permission !== "FullAccess") {
    return console.log(`Account [${txSender}] does not have permission to send tokens using key: [${publicKey}]`);
  };

  // Each transaction requires a unique number or nonce
  // This is created by taking the current nonce and incrementing it
  const nonce = ++accessKey.nonce;
  console.log("Calculated nonce:", nonce);

  // Construct actions that will be passed to the createTransaction method below
  const actions = [near.transactions.transfer(txAmount)];

  // Convert a recent block hash into an array of bytes.
  // This is required to prove the tx was recently constructed (within 24hrs)
  const recentBlockHash = near.utils.serialize.base_decode(accessKey.block_hash);

  // Create a new transaction object
  const transaction = near.transactions.createTransaction(
    txSender,
    publicKey,
    txReceiver,
    nonce,
    actions,
    recentBlockHash
  );

  // Before we can sign the transaction we must perform three steps
  // 1) Serialize the transaction in Borsh
  const serializedTx = near.utils.serialize.serialize(
    near.transactions.SCHEMA,
    transaction
  );

  // 2) Hash the serialized transaction using sha256
  const serializedTxHash = new Uint8Array(sha256.array(serializedTx));

  // 3) Create a signature using the hashed transaction
  const signature = keyPair.sign(serializedTxHash);

  // Sign the transaction
  const signedTransaction = new near.transactions.SignedTransaction({
    transaction,
    signature: new near.transactions.Signature({
      keyType: transaction.publicKey.keyType,
      data: signature.signature
    })
  });

  // Send the transaction
  try {
    const result = await provider.sendTransaction(signedTransaction);

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
