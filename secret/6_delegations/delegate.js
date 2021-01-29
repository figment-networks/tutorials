const {
    CosmWasmClient, Secp256k1Pen, pubkeyToAddress, encodeSecp256k1Pubkey, makeSignBytes
} = require("secretjs");

require('dotenv').config();

const main = async () => {
    const mnemonic = process.env.MNEMONIC;
    const signingPen = await Secp256k1Pen.fromMnemonic(mnemonic);
    const pubkey = encodeSecp256k1Pubkey(signingPen.pubkey);
    const accAddress = pubkeyToAddress(pubkey, 'secret');
    const client = new CosmWasmClient(process.env.SECRET_REST_URL);
    // Define the validator address to delegate
    const valAddress = '<VALIDATOR ADDRESS YOU WANT TO DELEGATE>';

    const memo = 'My first secret delegation';

    const sendMsg = {
        type: "cosmos-sdk/MsgDelegate",
        value: {
            delegator_address: accAddress,
            validator_address: valAddress,
            amount: {
                denom: "uscrt",
                amount: "1000000",
            },
        },
    };

    const fee = {
        amount: [
            {
                amount: "50000",
                denom: "uscrt",
            },
        ],
        gas: "200000",
    };

    const chainId = await client.getChainId();
    const { accountNumber, sequence } = await client.getNonce(accAddress);
    const signBytes = makeSignBytes([sendMsg], fee, chainId, memo, accountNumber, sequence);
    const signature = await signingPen.sign(signBytes);
    const signedTx = {
        msg: [sendMsg],
        fee: fee,
        memo: memo,
        signatures: [signature],
    };
    const { logs, transactionHash } = await client.postTx(signedTx);

    // Query the tx result
    const query = {id: transactionHash}
    const tx = await client.searchTx(query)
    console.log('Transaction: ', tx);
}

main().then(resp => {
    console.log(resp);
}).catch(err => {
    console.log(err);
})