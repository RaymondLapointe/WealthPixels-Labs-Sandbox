/* eslint-disable no-underscore-dangle */
const { assert, expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { provider } = waffle;
const { constants } = require("@openzeppelin/test-helpers");
const {
  abi: WEALTHTOKEN_ABI,
} = require("../artifacts/contracts/WealthPixel/WealthToken.sol/WealthToken.json");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wealthpixel-a075d-default-rtdb.firebaseio.com",
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
  LINK_ADDRESS,
  LINK_ABI,
  LINK_PRICEPROVIDER,
  DAI_PRICEPROVIDER,
  USDT_PRICEPROVIDER,
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

    COMPONENTS = [DAI_ADDRESS, LINK_ADDRESS];
    COMPONENTS_PROPORTIONS = [50, 50];

    const COMOPONENT_TOKENS = [DAI_ADDRESS, LINK_ADDRESS];
    const COMOPONENT_TOKENS_PROPORTIONS = [50, 50];

    wPriceProviderInstance = await PriceProvider.deploy(owner.address);
    console.log(
      "wPriceProviderInstance+++++++++++++",
      wPriceProviderInstance.address
    );
    wTokenConInstance = await WToken.deploy(
      usdtTokenAddress,
      COMOPONENT_TOKENS,
      COMOPONENT_TOKENS_PROPORTIONS,
      wPriceProviderInstance.address,
      WTOKEN_NAME,
      WTOKEN_SYMBOL
    );
    console.log("wTokenConInstance+++++++++++++", wTokenConInstance.address);
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
    uniConInstance = await ethers.getContractAt(LINK_ABI, LINK_ADDRESS);

    const usdtBalance = await usdtConInstance.balanceOf(address);
    const daiBalance = await daiConInstance.balanceOf(address);
    const linkBalance = await uniConInstance.balanceOf(address);

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
      .transfer(wTokenConInstance.address, linkBalance);

    await usdtConInstance
      .connect(investor1)
      .approve(wTokenConInstance.address, 10000000000000);

    await usdtConInstance
      .connect(investor2)
      .approve(wTokenConInstance.address, 10000000000000);
    //set the price provider assests
    await wPriceProviderInstance.setupAsset(
      DAI_ADDRESS,
      DAI_PRICEPROVIDER,
      3600
    );
    await wPriceProviderInstance.setupAsset(
      LINK_ADDRESS,
      LINK_PRICEPROVIDER,
      3600
    );
    await wPriceProviderInstance.setupAsset(
      usdtConInstance.address,
      USDT_PRICEPROVIDER,
      86400
    );
  });

  context("WealthToken: Deploy", () => {
    context("after successful deposit", () => {
      it("should allow the owner to set components proportions", async () => {

        await wTokenConInstance
        .connect(investor1)
        .depositToken(usdtConInstance.address, 1000000000);

        const ComponentsProportions =
        await wTokenConInstance.getComponentsProportions();
        console.log(
            "retrievedComponentsProportions",
            ComponentsProportions[0]
          );
        console.log(
            "retrievedComponentsProportions",
            ComponentsProportions[1]
        );
      
      
        let daiBal = await daiConInstance.balanceOf(investor1.address);
        let linkBal = await uniConInstance.balanceOf(investor1.address);
        console.log("linkBal", linkBal);
        console.log("daiBal", daiBal);

        const componentsProportions = [80, 20]; // Example components proportions array
        // Call the setComponentsProportions function
        await wPriceProviderInstance.setComponentsProportions(
          wTokenConInstance.address,
          componentsProportions
        );
        // Retrieve the components proportions from the WealthToken contract
        //const retrievedComponentsProportions = await wTokenConInstance.getComponentsProportions();

        const retrievedComponentsProportions =
          await wTokenConInstance.getComponentsProportions();
        console.log(
        "retrievedComponentsProportions",
        retrievedComponentsProportions[0]
        );
        console.log(
          "retrievedComponentsProportions",
          retrievedComponentsProportions[1]
        );
        

        const tx = await wTokenConInstance
          .connect(investor1)
          .depositToken(usdtConInstance.address, 1000000000);
        const receipt = await tx.wait();
        let logData = {
          events: [], // Add an empty array to hold event objects
        };

        receipt.events.forEach((event) => {
          if (event.event === "ComponentTransferred") {
            // Create an event object with the current event's details
            const currentEvent = {
              component: event.args.component,
              to: event.args.to,
              amount: Number(event.args.amount),
              timestamp: Number(event.args.timestamp),
              price: Number(event.args.price),
            };

            // Push the current event object into the events array
            logData.events.push(currentEvent);

            // Log the current state of logData to see the accumulated events
            console.log("Accumulated Events:", logData.events);
          }
        });

        // After processing all events, save the entire logData object to Firestore
        try {
          await db.collection("ComponentTransferred").add(logData);
          console.log("All logs saved to Firestore:", logData);
        } catch (error) {
          console.error("Error saving logs to Firestore:", error);
        }

        daiBal = await daiConInstance.balanceOf(investor1.address);
        linkBal = await uniConInstance.balanceOf(investor1.address);
        console.log("linkBal", linkBal);
        console.log("daiBal", daiBal);
      });
    });
  });
});
