/* eslint-disable no-underscore-dangle */
const { assert, expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { provider } = waffle;
const { constants } = require("@openzeppelin/test-helpers");
const {
  abi: WEALTHTOKEN_ABI,
} = require("../artifacts/contracts/WealthPixel/WealthToken.sol/WealthToken.json");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');


// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wealthpixel-a075d-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });


const {
  // eslint-disable-next-line max-len
  ONEINCHEXCHANGE_ABI,
  ONEINCHEXCHANGE_ADDRESS,
  DAI_ABI,
  DAI_ADDRESS,
  USDT_ABI,
  USDT_ADDRESS,
  UNI_ADDRESS,
  UNI_ABI,
  UNI_PRICEPROVIDER,
  DAI_PRICEPROVIDER,
  USDT_PRICEPROVIDER
} = require("../utils/constants");
const ether = require("@openzeppelin/test-helpers/src/ether");

const getBigNumber = (number) => ethers.BigNumber.from(number);

describe("WealthToken is [Ownable]", (accounts) => {
  let platformWallet;
  let recipient;
  let investor1;
  let investor2;

  const WTOKEN_NAME = "WToken";
  const WTOKEN_SYMBOL = "W1T";

  const TOKENS_NAME = "Token";
  const TOKENS_SYMBOL = "TokenS";

  const TOKENX_NAME = "Token";
  const TOKENX_SYMBOL = "TokenX";

  const TOKENY_NAME = "Token";
  const TOKENY_SYMBOL = "TokenY";

  const XTOKEN_SUPPLY = "10000000000000";
  const YTOKEN_SUPPLY = "10000000000000";
  const STOKEN_SUPPLY = "20000000000000";

  let COMPONENTS;
  let COMPONENTS_PROPORTIONS;
  let usdtTokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  let wTokenConInstance;
  let wPriceProviderInstance;
  let tokenYConInstance;

  let daiConInstance;
  let saiConInstance;
  let usdtConInstance;
  let uniConInstance;
  let txObject;
  let receipt;

  before(async () => {
    const userAccounts = await ethers.getSigners();
    [platformWallet, recipient, investor1, investor2, owner] = userAccounts;

    const WToken = await ethers.getContractFactory("WealthToken");
    const PriceProvider = await ethers.getContractFactory(
      "ChainlinkV3PriceProvider" 
    );
    
    COMPONENTS = [DAI_ADDRESS, UNI_ADDRESS];
    COMPONENTS_PROPORTIONS = [50, 50];

    const COMOPONENT_TOKENS = [DAI_ADDRESS, UNI_ADDRESS];
    const COMOPONENT_TOKENS_PROPORTIONS = [50, 50];

    wPriceProviderInstance = await PriceProvider.deploy(owner.address);
    console.log("wPriceProviderInstance+++++++++++++",wPriceProviderInstance.address);
    wTokenConInstance = await WToken.deploy(
      usdtTokenAddress,
      COMOPONENT_TOKENS,
      COMOPONENT_TOKENS_PROPORTIONS,
      wPriceProviderInstance.address,
      WTOKEN_NAME,
      WTOKEN_SYMBOL
    );
    console.log("wTokenConInstance+++++++++++++",wTokenConInstance.address);
    // MAINNET CONTRACT INSTANCES
    oneInchConInstance = await ethers.getContractAt(
      ONEINCHEXCHANGE_ABI,
      ONEINCHEXCHANGE_ADDRESS
    );

    // const accountToInpersonate = "0xBc761ee2Bb6eA585d2C400751b1670D46B4A3417"

    // await hre.network.provider.request({
    //   method: "hardhat_impersonateAccount",
    //   params: [accountToInpersonate]
    // })

    const address = "0xBc761ee2Bb6eA585d2C400751b1670D46B4A3417";
    await helpers.impersonateAccount(address);
    const accountToInpersonate = await ethers.getSigner(address);
    //const signer = await ethers.getSigners(accountToInpersonate);
    //console.log("signer", signer);
    daiConInstance = await ethers.getContractAt(DAI_ABI, DAI_ADDRESS);
    usdtConInstance = await ethers.getContractAt(USDT_ABI, USDT_ADDRESS);
    uniConInstance = await ethers.getContractAt(UNI_ABI, UNI_ADDRESS);

    const usdtBalance = await usdtConInstance.balanceOf(address);
    const daiBalance = await daiConInstance.balanceOf(address);
    const uniBalance = await uniConInstance.balanceOf(address);
   
    // Transfer components token balance to wealthToken and usdtToken balance to investors
    await usdtConInstance
      .connect(accountToInpersonate)
      .transfer(investor1.address, 5000000000);
    await usdtConInstance
      .connect(accountToInpersonate)
      .transfer(investor2.address, 5000000000);

    await daiConInstance
      .connect(accountToInpersonate)
      .transfer(wTokenConInstance.address, daiBalance);

    await uniConInstance
      .connect(accountToInpersonate)
      .transfer(wTokenConInstance.address, uniBalance);

    await usdtConInstance
      .connect(investor1)
      .approve(wTokenConInstance.address, 10000000000000);

    await usdtConInstance
      .connect(investor2)
      .approve(wTokenConInstance.address, 10000000000000);
    //set the price provider assests 
    await wPriceProviderInstance.setupAsset(DAI_ADDRESS,DAI_PRICEPROVIDER,3600);
    await wPriceProviderInstance.setupAsset(UNI_ADDRESS,UNI_PRICEPROVIDER,3600);
    await wPriceProviderInstance.setupAsset(usdtConInstance.address,USDT_PRICEPROVIDER,86400);
  });
  
  // context("Basic checks for [WealthToken, TokenX] contracts", () => {
  //   context("Contract TokenX ", () => {
  //     it("should have token name to be `TokenX`", async () => {
  //       expect(await tokenXConInstance.name()).to.equal(
  //         TOKENX_NAME,
  //         "Token name do not match"
  //       );
  //     });
  //     it("should have token symbol to be `AFinance`", async () => {
  //       expect(await tokenXConInstance.symbol()).to.equal(
  //         TOKENX_SYMBOL,
  //         "Token symbol do not match"
  //       );
  //     });
  //     it("should have token tokenDecimals to be 8", async () => {
  //       expect(await tokenXConInstance.decimals()).to.equal(
  //         8,
  //         "Token decimals do not match"
  //       );
  //     });
  //     it("should verify totalSupply is 100000", async () => {
  //       expect(await tokenXConInstance.totalSupply()).to.equal(
  //         XTOKEN_SUPPLY,
  //         "Total supply do not match"
  //       );
  //     });
  //   });

  //   context("Contract TokenY ", () => {
  //     it("should have token name to be `TokenY`", async () => {
  //       expect(await tokenYConInstance.name()).to.equal(
  //         TOKENY_NAME,
  //         "Token name do not match"
  //       );
  //     });
  //     it("should have token symbol to be `TokenY`", async () => {
  //       expect(await tokenYConInstance.symbol()).to.equal(
  //         TOKENY_SYMBOL,
  //         "Token symbol do not match"
  //       );
  //     });
  //     it("should have token tokenDecimals to be 8", async () => {
  //       expect(await tokenYConInstance.decimals()).to.equal(
  //         8,
  //         "Token decimals do not match"
  //       );
  //     });
  //     it("should verify totalSupply is 100000", async () => {
  //       expect(await tokenYConInstance.totalSupply()).to.equal(
  //         YTOKEN_SUPPLY,
  //         "Total supply do not match"
  //       );
  //     });
  //   });

  //   context("Contract TokenS ", () => {
  //     it("should have token name to be `TokenS`", async () => {
  //       expect(await tokenSConInstance.name()).to.equal(
  //         TOKENS_NAME,
  //         "Token name do not match"
  //       );
  //     });
  //     it("should have token symbol to be `TokenS`", async () => {
  //       expect(await tokenSConInstance.symbol()).to.equal(
  //         TOKENS_SYMBOL,
  //         "Token symbol do not match"
  //       );
  //     });
  //     it("should have token tokenDecimals to be 8", async () => {
  //       expect(await tokenSConInstance.decimals()).to.equal(
  //         8,
  //         "Token decimals do not match"
  //       );
  //     });
  //     it("should verify totalSupply is 200000", async () => {
  //       expect(await tokenSConInstance.totalSupply()).to.equal(
  //         STOKEN_SUPPLY,
  //         "Total supply do not match"
  //       );
  //     });
  //   });
  // });

  context("WealthToken: Deploy", () => {
    let WTokenInstance;
    before(async () => {
      WTokenInstance = await ethers.getContractFactory("WealthToken");
    });
    context("reverts", () => {
      it("reverts when inputTokenAddress contract is zero address", async () => {
        console.log("checkout")
        await expect(
          WTokenInstance.deploy(
            constants.ZERO_ADDRESS,
            [DAI_ADDRESS, UNI_ADDRESS],
            [50, 50],
            wPriceProviderInstance.address,
            WTOKEN_NAME,
            WTOKEN_SYMBOL
          )
        ).to.be.revertedWith("inputToken cannot be zero addr");
      });

      it("reverts when component address is zero address", async () => {
        await expect(
          WTokenInstance.deploy(
            usdtTokenAddress,
            [constants.ZERO_ADDRESS, UNI_ADDRESS],
            [50, 50],
            wPriceProviderInstance.address,
            WTOKEN_NAME,
            WTOKEN_SYMBOL
          )
        ).to.be.revertedWith("Component address zero");
      });

      it("reverts when component proportion is zero address", async () => {
        await expect(
          WTokenInstance.deploy(
            usdtTokenAddress,
            [DAI_ADDRESS, UNI_ADDRESS],
            [0, 50],
            wPriceProviderInstance.address,
            WTOKEN_NAME,
            WTOKEN_SYMBOL
          )
        ).to.be.revertedWith("Component proportion zero");
      });
    });

    context("Create WealthToken and variable checks ", () => {
      it("deploys WealthToken contract successfully", async () => {
        const previousWealthToken = wTokenConInstance.address;
        wTokenConNewInstance = await WTokenInstance.deploy(
          usdtTokenAddress,
          [DAI_ADDRESS, UNI_ADDRESS],
          [50, 50],
          wPriceProviderInstance.address,
          WTOKEN_NAME,
          WTOKEN_SYMBOL
        );
        expect(wTokenConNewInstance.address).to.not.equal(
          previousWealthToken,
          "New Wealth Token is same as old factory"
        );
      });

      it("should return all getInvestorsLength lenght to be 0", async () => {
        expect(
          await wTokenConNewInstance.getInvestorsLength(),
          0,
          "Underlying tokens length do not match"
        );
      });

      it("should have components set as expected", async () => {
        const components = await wTokenConNewInstance.getComponents();
        // Check if lengths of both arrays are equal
        expect(components.length).to.equal(COMPONENTS.length);

        // Check if every component matches COMPONENTS (case insensitive)
        components.forEach((component, index) => {
          expect(component.toLowerCase()).to.equal(
            COMPONENTS[index].toLowerCase()
          );
        });
      });

      it("should have componentsProportions set as expected", async () => {
        const componentsProportions =
          await wTokenConNewInstance.getComponentsProportions();
        const componentsProportionsInDecimals = componentsProportions.map(
          (uTokProp) => Number(uTokProp._hex)
        );
        expect(componentsProportionsInDecimals).to.deep.equal(
          COMPONENTS_PROPORTIONS,
          "componentsProportions do not match"
        );
      });

      it("should have usdtTokenAddress contract address to be `usdtTokenAddress`", async () => {
        expect(
          await wTokenConNewInstance.inputTokenAddress(),
          usdtTokenAddress,
          "usdtTokenAddress address contract address do not match"
        );
      });

      it("should have token name to be `W1Token`", async () => {
        expect(
          await wTokenConNewInstance.name(),
          WTOKEN_NAME,
          "Token name do not match"
        );
      });

      it("should have token symbol to be `A1t`", async () => {
        expect(
          await wTokenConNewInstance.symbol(),
          WTOKEN_SYMBOL,
          "Token symbol do not match"
        );
      });
    });

    context("Deposit stable coin", () => {
      let investorInfo;
      context("before deposits", () => {
        it("should check investor1 is not present", async () => {
          console.log('checkout');
          investorInfo = await wTokenConNewInstance.investorInfo(
            investor1.address
          );
          expect(investorInfo.isPresent).to.equal(false, "Investor is present");
        });
        it("should check total invested ETH to be 0", async () => {
          expect(await wTokenConNewInstance.getInputTokenBalance()).to.equal(
            0,
            "Invested TokenY value do not match"
          );
        });
        it("should check investor1 tokenX balance to be 0", async () => {
          expect(await daiConInstance.balanceOf(investor1.address)).to.equal(
            0,
            "Investor tokenXConInstance token balances do not match"
          );
        });

        it("should check investor1 tokenY balance to be 0", async () => {
          expect(await uniConInstance.balanceOf(investor1.address)).to.equal(
            0,
            "Investor tokenYConInstance token balances do not match"
          );
        });

        it("should check total investors to be 0", async () => {
          expect(await wTokenConNewInstance.getInvestorsLength()).to.equal(
            0,
            "Total investors do not match"
          );
        });
      });

      context("investor1 & investor2 deposits 1000 usdt each", () => {
        context("before deposit", () => {
          let invInfo;
          context("investor1", () => {
            it("should check total invested usdt to be 0", async () => {
              expect(
                await wTokenConNewInstance.getInputTokenBalance()
              ).to.equal(0);
            });
            it("should check investor struct has all default values", async () => {
              invInfo = await wTokenConNewInstance.getInvestorDetails(
                investor1.address
              );
              const {
                isPresent,
                ethDeposits,
                depositedAt,
                ethWithdrawn,
                withdrawnAt,
                tokensIssued,
              } = invInfo;
              const expectedInvInfo = {
                isPresent: false,
                ethDeposits: "0x00",
                depositedAt: "0x00",
                ethWithdrawn: "0x00",
                withdrawnAt: "0x00",
                tokensIssued: "0x00",
              };
              const actualInvInfo = {
                isPresent,
                ethDeposits: ethDeposits._hex,
                depositedAt: depositedAt._hex,
                ethWithdrawn: ethWithdrawn._hex,
                withdrawnAt: withdrawnAt._hex,
                tokensIssued: tokensIssued._hex,
              };
              expect(expectedInvInfo).to.deep.equal(actualInvInfo);
            });
            it("should check contracts uTokenBalance is 0", async () => {
              const usdtBal = await usdtConInstance.balanceOf(
                wTokenConInstance.address
              );
              const contractUTokenBlance = [usdtBal];
              const formatUTokBal = contractUTokenBlance.map(
                (cuTokBal) => cuTokBal._hex
              );
              expect(formatUTokBal).to.deep.equal(["0x00"]);
            });

            it("should check investor components balance is 0", async () => {
              const daiBal = await daiConInstance.balanceOf(
                investor1.address
              );
              const uniBal = await uniConInstance.balanceOf(
               investor1.address
              );
              
              const contractUTokenBlance = [daiBal, uniBal];
              const formatUTokBal = contractUTokenBlance.map(
                (cuTokBal) => cuTokBal._hex
              );
              expect(formatUTokBal).to.deep.equal(["0x00", "0x00"]);
            });
          });
        });
      });

      context("investor1 deposits 1000 usdt", () => {
        it("investor1 deposits 1000 usdt", async () => {
          const tx = await wTokenConInstance.connect(investor1).depositToken(usdtConInstance.address, 1000000000);
          const receipt = await tx.wait();
          // const event = receipt.events.find(e => e.event === 'ComponentTransferred');
          // console.log(event.args);
          // console.log("print component",event.args.component);
          // console.log("print to",event.args.to);
          // console.log("print amount",Number(event.args.amount));
          // console.log("print timestamp",Number(event.args.timestamp));

          receipt.events.forEach((event) => {
            if (event.event === 'ComponentTransferred') {
              //console.log(event.args);
              console.log("Print component", event.args.component);
              console.log("Print to", event.args.to);
              console.log("Print amount", Number(event.args.amount));
              console.log("Print timestamp", Number(event.args.timestamp));
            }
          });
          
        });
        
        it("should check investor components balance is 0", async () => {
          const daiBal = await daiConInstance.balanceOf(
            investor1.address
          );
          const uniBal = await uniConInstance.balanceOf(
           investor1.address
          );
          console.log("uniBal",uniBal);
          console.log("daiBal",daiBal);
          const contractUTokenBlance = [daiBal, uniBal];
          const formatUTokBal = contractUTokenBlance.map(
            (cuTokBal) => cuTokBal._hex
          );
          expect(formatUTokBal.every(balance => parseInt(balance, 16) > 0)).to.be.true;

        });

      });
      
      context("after successful deposit", () => {
        let invInfo;
        context("investor1", () => {
          it("should check total investors to be 1", async () => {
            expect(
              await wTokenConInstance.getInvestorsLength(),
              1,
              "Total investors do not match"
            );
          });
          it("should check total invested yToken to be 1000", async () => {
            expect(await wTokenConInstance.getInputTokenBalance()).to.equal(
              "1000000000"
            );
          });
          it("should check investor struct is updated", async () => {
            invInfo = await wTokenConInstance.getInvestorDetails(
              investor1.address
            );
            const {
              isPresent,
              ethDeposits,
              depositedAt,
              ethWithdrawn,
              withdrawnAt,
              tokensIssued,
            } = invInfo;
            const latestBlock = await provider.getBlock("latest");
           
            depositedAtTimestamp = getBigNumber(latestBlock.timestamp);
            const expectedInvInfo = {
              isPresent: true,
              ethDeposits: 0,
              depositedAt: depositedAtTimestamp,
              ethWithdrawn: 0,
              withdrawnAt: 0,
              tokensIssued: 0,
            };
            const actualInvInfo = {
              isPresent,
              ethDeposits: 0,
              depositedAt,
              ethWithdrawn: 0,
              withdrawnAt: 0,
              tokensIssued:0,
            };
            expect(expectedInvInfo).to.deep.equal(actualInvInfo);
          });
  
          it("should allow the owner to set components proportions", async () => {
            let daiBal = await daiConInstance.balanceOf(
              investor1.address
            );
            let uniBal = await uniConInstance.balanceOf(
             investor1.address
            );
            console.log("uniBal",uniBal);
            console.log("daiBal",daiBal);
            
              const componentsProportions = [80, 20]; // Example components proportions array
              // Call the setComponentsProportions function
              await wPriceProviderInstance.setComponentsProportions(wTokenConInstance.address, componentsProportions);
              // Retrieve the components proportions from the WealthToken contract
              //const retrievedComponentsProportions = await wTokenConInstance.getComponentsProportions();

            const retrievedComponentsProportions = await wTokenConInstance.getComponentsProportions();
            console.log("retrievedComponentsProportions",retrievedComponentsProportions[1])
            console.log("retrievedComponentsProportions",retrievedComponentsProportions[0])
            
            const componentsProportionsInDecimals = retrievedComponentsProportions.map(
              (uTokProp) => Number(uTokProp._hex)
              );

            const getComponent = componentsProportions.map(
              (uTokProp) => Number(uTokProp._hex)
              );
               
            //await wTokenConInstance.connect(investor1).depositToken(usdtConInstance.address, 1000000000);
            const tx = await wTokenConInstance.connect(investor1).depositToken(usdtConInstance.address, 1000000000);
            const receipt = await tx.wait();
            // const event = receipt.events.find(e => e.event === 'ComponentTransferred');
            // console.log(event.args);
            // console.log("print component 1",event.args.component);
            // console.log("print to 1",event.args.to);
            // console.log("print amount 1",Number(event.args.amount));
            // console.log("print timestamp 1",Number(event.args.timestamp));
            let logData = {
              component: null,
              to: null,
              amount: null,
              timestamp: null,
            }
          
            receipt.events.forEach((event) => {
              if (event.event === 'ComponentTransferred') {
                //console.log(event.args);
                console.log("Print component 1", event.args.component);
                console.log("Print to 1", event.args.to);
                console.log("Print amount 1", Number(event.args.amount));
                console.log("Print timestamp 1", Number(event.args.timestamp));
                console.log('Log saved to Firestore:1', logData);
                logData.component =  event.args.component;
                logData.to =  event.args.to;
                logData.amount = Number(event.args.amount);
                logData.timestamp = Number(event.args.timestamp);
                
              }
             
              
             
              // } catch (error) {
              //   console.error('Error saving log to Firestore:', error);
              // }
                
               
            });
           
            await db.collection('ComponentTransferred').add(logData);
            console.log('Log saved to Firestore:', logData);

            daiBal = await daiConInstance.balanceOf(
              investor1.address
            );
             uniBal = await uniConInstance.balanceOf(
             investor1.address
            );
            console.log("uniBal",uniBal);
            console.log("daiBal",daiBal);
            // expect(componentsProportionsInDecimals).to.deep.equal(
            //   getComponent,
            //   "componentsProportions do not match"
            // );
            //expect(componentsProportions).to.equal(retrievedComponentsProportions);

          });
        });
      });
    });
  });
});
