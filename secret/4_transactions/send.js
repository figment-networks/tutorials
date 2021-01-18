const {
  CosmWasmClient, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, makeSignBytes,
} = require('secretjs');

require('dotenv').config();

const main = async () => {
  // As in previous tutorial, initialise client from ENV
  const mnemonic = process.env.MNEMONIC;
  const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic)
    .catch((err) => { throw new Error(`Could not get signing pen: ${err}`); });
  const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
  const accAddress = pubkeyToAddress(pubkey, 'secret');
  const client = new CosmWasmClient(process.env.SECRET_REST_URL);

  // Optionally, define a memo for the transaction
  const memo = 'My first secret transaction, sending uscrt to my own address';

  // 1. Define TX message
  const sendMsg = {
    type: 'cosmos-sdk/MsgSend',
    value: {
      from_address: accAddress,
      to_address: accAddress,
      amount: [
        {
          denom: 'uscrt',
          amount: '1000000',
        },
      ],
    },
  };

  // 2. Define fees
  const fee = {
    amount: [
      {
        amount: '50000',
        denom: 'uscrt',
      },
    ],
    gas: '100000',
  };

  // 3. Sign transaction
  const chainId = await client.getChainId()
    .catch((err) => { throw new Error(`Could not get chain id: ${err}`); });
  const { accountNumber, sequence } = await client.getNonce(accAddress)
    .catch((err) => { throw new Error(`Could not get nonce: ${err}`); });
  const signBytes = makeSignBytes([sendMsg], fee, chainId, memo, accountNumber, sequence);
  const signature = await signingPen.sign(signBytes)
    .catch((err) => { throw new Error(`Could not sign: ${err}`); });
  const signedTx = {
    msg: [sendMsg],
    fee,
    memo,
    signatures: [signature],
  };

  // 4. Broadcast TX
  const { transactionHash } = await client.postTx(signedTx)
    .catch((err) => { throw new Error(`Could not post tx: ${err}`); });

  // 5. Query TX by hash/ID
  const query = { id: transactionHash };
  const tx = await client.searchTx(query)
    .catch((err) => { throw new Error(`Could not search tx: ${err}`); });
  console.log('Transaction: ', tx);
};

main().catch((err) => {
  console.error(err);
});
