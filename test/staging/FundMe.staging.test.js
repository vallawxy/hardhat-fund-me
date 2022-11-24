const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChain } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

// describe.skips mean skip the whole describe
// if in localhost then skip, nid test in testnet
developmentChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("allows people to fund and withdraw", async function() {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })

// const { assert } = require("chai")
// const { network, ethers, getNamedAccounts } = require("hardhat")
// const { developmentChain } = require("../../helper-hardhat-config")

// developmentChain.includes(network.name)
//     ? describe.skip
//     : describe("FundMe Staging Tests", function() {
//           let deployer
//           let fundMe
//           const sendValue = ethers.utils.parseEther("0.1")
//           beforeEach(async () => {
//               deployer = (await getNamedAccounts()).deployer
//               fundMe = await ethers.getContract("FundMe", deployer)
//           })

//           it("allows people to fund and withdraw", async function() {
//               const fundTxResponse = await fundMe.fund({ value: sendValue })
//               await fundTxResponse.wait(1)
//               const withdrawTxResponse = await fundMe.withdraw()
//               await withdrawTxResponse.wait(1)

//               const endingFundMeBalance = await fundMe.provider.getBalance(
//                   fundMe.address
//               )
//               console.log(
//                   endingFundMeBalance.toString() +
//                       " should equal 0, running assert equal..."
//               )
//               assert.equal(endingFundMeBalance.toString(), "0")
//           })
//       })
