const { newKit } = require('@celo/contractkit');

require('dotenv').config();

const main = async () => {
  const client = newKit(process.env.REST_URL);
  const web3 = client.web3;

  const account =  web3.eth.accounts.create();

  console.log('address: ', account.address);
  console.log('privateKey: ', account.privateKey);
};

main().catch((err) => {
  console.error(err);
});
