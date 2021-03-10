// Load environment variables
require("dotenv").config()

// Load Avalanche SDK components
const initAvalanche = require("../init")

async function main() {
  // Initialize the main client and clients for individual APIs
  const client = initAvalanche()
  const info = client.Info()

  console.log("Fetching network information...")
  const nodeVersion = await info.getNodeVersion()
  const networkName = await info.getNetworkName()
  const networkID = await info.getNetworkID()
  const networkPeers = await info.peers()

  console.log("\nNetwork info:")
  console.log("* Node version:", nodeVersion)
  console.log("* Network name:", networkName)
  console.log("* Network ID:", networkID)
  console.log("* Connected Peers:", networkPeers.length)
}

main().catch((err) => {
  console.log("We have encountered an error!")
  console.error(err.stack)
})