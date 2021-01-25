const { newKit } = require('@celo/contractkit');

require('dotenv').config();

const main = async () => {
  // Create connection to DataHub Celo Network node
  const client = newKit(process.env.REST_URL);
  const web3 = client.web3;

  const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);

  // We need to add address to ContractKit in order to sign transactions
  client.addAccount(account.privateKey);

  // 12. Specify recipient Address
  let anAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'

  // 13. Specify an amount to send
  let amount = 100000

  // 14. Get the token contract wrappers
  let validatorsContract = await client.contracts.getValidators()
  let electionContract = await client.contracts.getElection()
  let releaseGoldContract = await client.contracts.getLockedGold()

  const validatorGroups = await validatorsContract.getRegisteredValidatorGroups();


  console.log('Validator Groups', validatorGroups);

  // Lock gold
  const some = await releaseGoldContract.lock();

  // Vote
  const res = await electionContract.vote(anAddress, amount);

  // Activate
  electionContract.activate();


};

main().catch((err) => {
  console.error(err);
});
