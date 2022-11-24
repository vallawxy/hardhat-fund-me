const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChain } = require("../../helper-hardhat-config")

!developmentChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // 1ETH

          beforeEach(async function() {
              // deploy contract using hardhat deploy
              // tags
              // const accounts = await ethers.getSigner()
              // const accountZero = accounts[0]

              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              // connect with deployer account
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
              // ethers.getContract(contractAddress, contractInterface)
              // connect deployer to fund me account
          })
          describe("constructor", function() {
              it("sets the aggregator addresses correctly", async function() {
                  const response = await fundMe.getPriceFeed()
                  console.log(response)
                  //check isit same with the mock aggregator since it is local
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", function() {
              it("Fails if you don't send enough ETH", async function() {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!" //must same in contract
                  )
              })
              // test addressToAmountFunded function
              it("updated the amount funded data structure", async function() {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  ) // bigNumber
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async function() {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", function() {
              // need have fund first
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async function() {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  // ethers.provider
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  // will use gas
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  ) // use add becasue is bigNumber
              })
              it("Allow us to withdraw multiple funders", async function() {
                  // use fund() by different account
                  const accounts = await ethers.getSigners()
                  // 0 is deployer
                  // Arrange
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      fundMeConnectedContract.fund({
                          value: sendValue
                      })
                  }

                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  // ethers.provider
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  assert.equal(endingFundMeBalance, 0)
                  // assert.equal(
                  //     endingFundMeBalance.add(startingDeployerBalance).toString(),
                  //     endingDeployerBalance.add(gasCost).toString()
                  // ) // use add becasue is bigNumber

                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // loop to make sure all amount are zero
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function() {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted
              })

              it("cheaperWithdraw testing...", async function() {
                  // use fund() by different account
                  const accounts = await ethers.getSigners()
                  // 0 is deployer
                  // Arrange
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      fundMeConnectedContract.fund({
                          value: sendValue
                      })
                  }

                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  // ethers.provider
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  // gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  assert.equal(endingFundMeBalance, 0)
                  // assert.equal(
                  //     endingFundMeBalance.add(startingDeployerBalance).toString(),
                  //     endingDeployerBalance.add(gasCost).toString()
                  // ) // use add becasue is bigNumber

                  // Make sure that the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // loop to make sure all amount are zero
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("cheaper withdraw ETH from a single founder", async function() {
                  // Arrange
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  // ethers.provider
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  // will use gas
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // gasCost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  ) // use add becasue is bigNumber
              })
          })
      })
