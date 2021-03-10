// Load libraries and helpers
const fs = require("fs")
const avalanche = require("avalanche")
const Web3 = require("web3")
const initAvalanche = require("../init")

// Path where we keep the credentials for the pathway
const credentialsPath = "./credentials"

async function main() {
  // Initialize avalanche components
  const client = initAvalanche()

  // Initialize chain components
  const xChain = client.XChain()
  const xKeychain = xChain.keyChain()
  const cChain = client.CChain()
  const cKeychain = cChain.keyChain()

  // Import keypair from the previously created file
  const data = JSON.parse(fs.readFileSync(`${credentialsPath}/keypair.json`))
  xKeychain.importKey(data.privkey)
  cKeychain.importKey(data.privkey)

  // Load or generate a Etherium-like address/private key
  let account = null
  if (!fs.existsSync(`${credentialsPath}/c-chain.json`)) {
    console.log("Creating a new Etherium address for C-Chain...")
    account = (new Web3()).eth.accounts.create()
    console.log("Create a new C-Chain address:", account.address)

    fs.writeFileSync(`${credentialsPath}/c-chain.json`, JSON.stringify({
      address: account.address,
      privateKey: account.privateKey
    }))
  } else {
    account = JSON.parse(fs.readFileSync(`${credentialsPath}/c-chain.json`))
  }

  // Create a X->C export transaction
  await createExport(client, xChain, xKeychain, cKeychain)

  // Add some delay to let the transaction clear first
  setTimeout(async function() {
    await createImport(client, cChain, cKeychain, account.address)
  }, 2000)
}

async function createExport(client, xChain, xKeychain, cKeychain) {
  // Prepare transaction details
  const amount = "50000000" // Total amount we're transferring = 0.05 AVAX
  const asset = "AVAX" // Primary asset used for the transaction (Avalanche supports many)

  // Fetch UTXOs (i.e unspent transaction outputs)
  const addresses = xKeychain.getAddressStrings()
  const utxos = (await xChain.getUTXOs(addresses)).utxos

  // Determine the real asset ID from its symbol/alias
  const assetInfo = await xChain.getAssetDescription(asset)
  const assetID = avalanche.BinTools.getInstance().cb58Encode(assetInfo.assetID)

  // Fetch current balance
  let balance = await xChain.getBalance(addresses[0], assetID)
  console.log("Current X-chain balance:", balance)

  // Get the real ID for the destination chain
  const destinationChain = await client.Info().getBlockchainID("C")

  // Prepare the export transaction from X -> C chain
  const exportTx = await xChain.buildExportTx(
    utxos,
    new avalanche.BN(amount),
    destinationChain,
    cKeychain.getAddressStrings(),
    xKeychain.getAddressStrings(),
    xKeychain.getAddressStrings(),
  )

  // Sign and send the transaction
  const exportTxID = await xChain.issueTx(exportTx.sign(xKeychain))
  console.log("X-chain export TX:", exportTxID)
}

async function createImport(client, cChain, cKeychain, address) {
  // Get the real ID for the source chain
  const sourceChain = await client.Info().getBlockchainID("X")

  // Fetch UTXOs (i.e unspent transaction outputs)
  const { utxos } = await cChain.getUTXOs(cKeychain.getAddressStrings(), sourceChain)

  // Generate an unsigned import transaction
  const importTx = await cChain.buildImportTx(
    utxos,
    address,
    cKeychain.getAddressStrings(),
    sourceChain,
    cKeychain.getAddressStrings()
  )

  // Sign and send import transaction
  const importTX = await cChain.issueTx(importTx.sign(cKeychain))
  console.log("C-chain import TX:", importTX)

  console.log("----------------------------------------------------------------")
  console.log(`Visit https://cchain.explorer.avax-test.network/address/${address} for balance details`)
  console.log("----------------------------------------------------------------")
}

main().catch((err) => {
  console.log("We have encountered an error!")
  console.error(err.stack)
})