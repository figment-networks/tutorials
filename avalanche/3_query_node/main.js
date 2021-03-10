const fs = require("fs")

// Load environment variables
require("dotenv").config()

// Load Avalanche SDK components
const initAvalanche = require("../init")

async function main() {
  const client = initAvalanche()

  await queryInfo(client.Info())
  await queryPChain(client.PChain())
  await queryXChain(client.XChain())
}

async function queryInfo(info) {
  // Fetch blockchain IDs by aliases
  console.log("========== Chain IDs ==========")
  console.log("- X:", await info.getBlockchainID("X"))
  console.log("- P:", await info.getBlockchainID("P"))
  console.log("- C:", await info.getBlockchainID("C"))
}

async function queryPChain(pChain) {
  console.log("========== Platform Chain Info ==========")

  // Fetch validator subnets
  console.log("Fetching validator subnets...")
  const subnets = await pChain.getSubnets()
  console.log("Found subnets:", subnets.length)
  console.log("Subnet example:", subnets[0])

  // Fetch information about Platform chain
  console.log("Fetching validators...")
  const { validators } = await pChain.getCurrentValidators()
  console.log("Found validators:", validators.length)
  console.log("Example validator:", validators[0])

  // Fetch validator details
  const validator = validators[0]
  const ownerBalance = await pChain.getBalance(validator.rewardOwner.addresses[0])
  console.log("Validator owner balance:", ownerBalance.balance)

  // Fetch current height
  const height = await pChain.getHeight()
  console.log("Current height:", height.toString(10))

  // Fetch current minimum staking amount for running a validator
  const minStake = await pChain.getMinStake()
  console.log("Current min stake:", minStake.minValidatorStake.toString(10))

  // Fetch current supply
  const supply = await pChain.getCurrentSupply()
  console.log("Current supply:", supply.toString(10))
}

async function queryXChain(xChain) {
  const fee = await xChain.getDefaultTxFee()

  console.log("========== Exchange Chain Info ==========")
  console.log("Default Fee:", fee.toString(10))
}

main().catch((err) => {
  console.log("We have encountered an error!")
  console.error(err.stack)
})