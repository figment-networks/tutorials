const {
  EnigmaUtils, SigningCosmWasmClient, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey,
} = require('secretjs');

require('dotenv').config();

const main = async () => {
  const mnemonic = process.env.MNEMONIC;
  const httpUrl = process.env.SECRET_REST_URL;
  const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic)
    .catch((err) => { console.error('Could not get signing pen:\n', err); });
  const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
  const accAddress = pubkeyToAddress(pubkey, 'secret');

  const txEncryptionSeed = EnigmaUtils.GenerateNewSeed();
  const fees = {
    send: {
      amount: [{ amount: '80000', denom: 'uscrt' }],
      gas: '80000',
    },
  };
  const client = new SigningCosmWasmClient(
    httpUrl,
    accAddress,
    (signBytes) => signingPen.sign(signBytes),
    txEncryptionSeed, fees,
  );
  const rcpt = accAddress; // Set recipient to sender for testing

  // optional memo
  const memo = 'sendTokens example';

  const sent = await client.sendTokens(rcpt, [{ amount: '1234', denom: 'uscrt' }], memo)
    .catch((err) => { console.error('Could not send tokens:\n', err); });
  console.log('sent', sent);

  // Query the tx result
  const query = { id: sent.transactionHash };
  const tx = await client.searchTx(query)
    .catch((err) => { console.error('Could not execute the search:\n', err); });
  console.log('Transaction: ', tx);
};

main().then((resp) => {
  console.log(resp);
}).catch((err) => {
  console.log(err);
});
