import { ethers } from "ethers";
// import * as admin from 'firebase-admin';
// import * as serviceAccount from './serviceAccountKey.json'; // Ensure this path is correct

let provider: any;
let currentBlock: number;
let rawLogs: any;

// // Initialize Firebase
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//   databaseURL: "https://fresh-ocean-376812-default-rtdb.firebaseio.com"
// });

// const db = admin.firestore();
// db.settings({ ignoreUndefinedProperties: true });

async function main() {
    await getProvider();
    await getCurrentBlock();
    await getLogs();
    await processLogsWithInterface();
}

async function getProvider() {
  console.log(`Configuring provider...`);
  //provider = ethers.getDefaultProvider('homestead'); // connect to the mainnet
  // URL for the forked network
  const infuraUrl = "https://mainnet.infura.io/v3/ad9a322ec8a34980b9f0c73a707aacf6";

  // Create a custom provider
   provider = new ethers.providers.JsonRpcProvider(infuraUrl);

  console.log(provider);
}

async function getCurrentBlock() {
  console.log(`Getting latest block number...`);
  currentBlock = await provider.getBlockNumber();
  console.log(`Latest block number: ${currentBlock}`);
}

async function getLogs() {
    console.log(`Getting the PunkTransfer events...`);
    const cryptopunkContractAddress: string = '0xd7a29a4E226D492905785d5c31F62956aA7ee3FE'; 
    const eventSignature: string = 'ComponentTransferred(address,address,uint256,uint256)';
    const eventTopic: string = ethers.utils.id(eventSignature); // Get the data hex string

    rawLogs = await provider.getLogs({
        address: cryptopunkContractAddress,
        topics: [eventTopic],
        fromBlock: currentBlock - 1000, 
        toBlock: currentBlock
    });
    console.log("rawlogs", rawLogs);
}

async function processLogsWithInterface() {
    const abi: string = '[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"punkIndex","type":"uint256"}],"name":"PunkTransfer","type":"event"}]';
    const intrfc = new ethers.utils.Interface(abi);

    for (const log of rawLogs) {
        console.log(`BEFORE PARSING:`);
        // console.debug(log);
        console.log(`\n`);
        await beforeLogToFirestore(log);

        console.log(`AFTER PARSING:`);
        let parsedLog = intrfc.parseLog(log);
        // console.debug(parsedLog);
        console.log('************************************************');

        // Save parsed log to Firestore
        await saveLogToFirestore(parsedLog);
    }
}
async function beforeLogToFirestore(log: any) {
  try {
    const logData = {
      topics: log.topics || null,
      address: log.address || null,
      transactionHash: log.transactionHash || null,
      blockNumber: log.blockNumber || null,
      data: log.data || null
    };
    //await db.collection('before').add(logData);
    console.log('Log saved to Firestore:', logData);
  } catch (error) {
    console.error('Error saving log to Firestore:', error);
  }
}





async function saveLogToFirestore(parsedLog: any) {
  try {
    const logData = {
      from: parsedLog.args.from || null,
      to: parsedLog.args.to || null,
      punkIndex:Number(parsedLog.args.punkIndex)|| null,


    };
    //await db.collection('punkTransfers').add(logData);
    console.log('Log saved to Firestore:', logData);
  } catch (error) {
    console.error('Error saving log to Firestore:', error);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
