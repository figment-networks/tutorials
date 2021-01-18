const {
  EnigmaUtils, SigningCosmWasmClient, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey,
} = require('secretjs');

require('dotenv').config();

const main = async () => {
  const mnemonic = process.env.MNEMONIC;
  const httpUrl = process.env.SECRET_REST_URL;
  const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic)
    .catch((err) => { throw new Error(`Could not get signing pen: ${err}`); });
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
    .catch((err) => { throw new Error(`Could not send tokens: ${err}`); });
  console.log('sent', sent);

  // Query the tx result
  const query = { id: sent.transactionHash };
  const tx = await client.searchTx(query)
    .catch((err) => { throw new Error(`Could not execute the search: ${err}`); });
  console.log('Transaction: ', tx);
};

main().catch((err) => {
  console.error(err);
});
