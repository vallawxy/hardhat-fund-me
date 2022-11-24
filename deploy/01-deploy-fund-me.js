// function deployFunc(hre) {
//     console.log("Hi!")
// hre.getNamedAccounts
// hre.deployments
// }

const { network } = require("hardhat")

// module.exports.default = deployFunc

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
//     // same like hre.getNamedAccounts and hre.deployments

// }
const { networkConfig, developmentChain } = require("../helper-hardhat-config")
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
const { verify } = require("../utils/verify")

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    //grab deployer accounts
    const chainId = network.config.chainId
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChain.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]
    // when going for localhost or hardhat network we want to use a mock
    // we want to change chain
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
        // if no just wait for one block
    })

    if (!developmentChain.includes(network.name) && ETHERSCAN_API_KEY) {
        // verify
        await verify(fundMe.address, args)
    }
}

module.exports.tags = ["all", "fundme"]
