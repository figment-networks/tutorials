const {
  EnigmaUtils, Secp256k1Pen, SigningCosmWasmClient, pubkeyToAddress, encodeSecp256k1Pubkey,
} = require('secretjs');

const fs = require('fs');

// Load environment variables
require('dotenv').config();

const customFees = {
  upload: {
    amount: [{ amount: '2000000', denom: 'uscrt' }],
    gas: '2000000',
  },
  init: {
    amount: [{ amount: '500000', denom: 'uscrt' }],
    gas: '500000',
  },
  exec: {
    amount: [{ amount: '500000', denom: 'uscrt' }],
    gas: '500000',
  },
  send: {
    amount: [{ amount: '80000', denom: 'uscrt' }],
    gas: '80000',
  },
};

const main = async () => {
  const httpUrl = process.env.SECRET_REST_URL;

  // Use key created in tutorial #2
  const mnemonic = process.env.MNEMONIC;

  // A pen is the most basic tool you can think of for signing.
  // This wraps a single keypair and allows for signing.
  const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic)
    .catch((err) => { throw new Error(`Could not get signing pen: ${err}`); });

  // Get the public key
  const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);

  // get the wallet address
  const accAddress = pubkeyToAddress(pubkey, 'secret');

  // 1. Initialize client
  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();

  const client = new SigningCosmWasmClient(
    httpUrl,
    accAddress,
    (signBytes) => signingPen.sign(signBytes),
    txEncryptionSeed, customFees,
  );
  console.log(`Wallet address=${accAddress}`);

  // 2. Upload the contract wasm
  const wasm = fs.readFileSync('5_contracts/contract.wasm');
  console.log('Uploading contract');
  const uploadReceipt = await client.upload(wasm, {})
    .catch((err) => { throw new Error(`Could not upload contract: ${err}`); });

  // 3. Create an instance of the Counter contract
  // Get the code ID from the receipt
  const { codeId } = uploadReceipt;

  // Create an instance of the Counter contract, providing a starting count
  const initMsg = { count: 101 };
  const contract = await client.instantiate(codeId, initMsg, `My Counter${Math.ceil(Math.random() * 10000)}`)
    .catch((err) => { throw new Error(`Could not instantiate contract: ${err}`); });
  const { contractAddress } = contract;
  console.log('contract: ', contract);

  // 4. Query the counter
  console.log('Querying contract for current count');
  let response = await client.queryContractSmart(contractAddress, { get_count: {} })
    .catch((err) => { throw new Error(`Could not query contract: ${err}`); });

  console.log(`Count=${response.count}`);

  // 5. Increment the counter
  const handleMsg = { increment: {} };
  console.log('Updating count');
  response = await client.execute(contractAddress, handleMsg)
    .catch((err) => { throw new Error(`Could not execute contract: ${err}`); });
  console.log('response: ', response);

  // Query again to confirm it worked
  console.log('Querying contract for updated count');
  response = await client.queryContractSmart(contractAddress, { get_count: {} })
    .catch((err) => { throw new Error(`Could not query contract: ${err}`); });

  console.log(`New Count=${response.count}`);
};

main().catch((err) => {
  console.error(err);
});
