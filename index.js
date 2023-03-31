import { ethers } from "./ethers-5.6.esm.min.js";

import { abi, contractAddress } from "./constants.js";

//onclicks added here as js in scripts defined as type="module" instead of type="text/javascript"
const connectBtn = document.getElementById("connectBtn");
const fundBtn = document.getElementById("fundBtn");
const balanceBtn = document.getElementById("balanceBtn");
const wdBtn = document.getElementById("wdBtn");
const fundAmt = document.getElementById("fundAmt");
const walletAddress = document.getElementById("walletAddr");
const totalBalance = document.getElementById("totalBalance");

connectBtn.onclick = connect;
fundBtn.onclick = fund;
balanceBtn.onclick = getBalance;
wdBtn.onclick = withdraw;

console.log(ethers);

//check if window.ethereum exists (metamask)
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const walletAddr = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (walletAddr) {
        connectBtn.innerHTML = "Connected!";
        walletAddress.innerHTML = walletAddr;
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    connectBtn.innerHTML = "Please install Metamask!";
  }
}

//fund contract
async function fund() {
  const ethAmt = document.getElementById("ethAmt").value || "0.1";
  if (typeof window.ethereum !== "undefined") {
    //need: 1. provider/connection to blockchain, 2. signer/wallet with gas, 3. contract's ABI and address to interact with
    const provider = new ethers.providers.Web3Provider(window.ethereum); //connect to metamask
    const signer = provider.getSigner(); //returns wallet connected to provider as signer
    //   console.log(signer);
    const contract = new ethers.Contract(contractAddress, abi, signer); //since once a contract is deployed it does not change, abi and addr is usually stored in a separate file (in this case, constants.js)
    try {
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmt),
      });
      //to show indication to user that transaction went through: either listen for the tx to be mined, or listen for an event
      //wait for transaction to finish
      await listenForMinedTransaction(transactionResponse, provider);
      fundAmt.innerHTML = `funding complete, you funded ${ethAmt}`;
      console.log("funding completed");
    } catch (err) {
      console.log(err);
    }
  } else {
    document.getElementById("connectBtn").innerHTML =
      "Please install Metamask!";
  }
  console.log(`fund with ${ethAmt}`);
}

function listenForMinedTransaction(transactionResponse, provider) {
  console.log(`mining... ${transactionResponse.hash}`);
  //create an event listener for the blockchain, in this case, a transactionReceipt, which then calls a function
  //add timeout for reject param (not here)
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `completeted: ${transactionReceipt.confirmations} confirmations`
      );
      //resolve promise once transactionResponse.hash is found
      resolve();
    });
  });
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    console.log(ethers.utils.formatEther(balance));
    totalBalance.innerHTML = ethers.utils.formatEther(balance);
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    console.log("withdrawing...");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const transactionResponse = await contract.withdraw();
      await listenForMinedTransaction(transactionResponse, provider);
    } catch (err) {
      console.log(err);
    }
  } else {
    document.getElementById("connectBtn").innerHTML =
      "Please install Metamask!";
  }
}
