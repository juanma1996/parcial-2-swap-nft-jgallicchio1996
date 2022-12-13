const { ethers } = require("hardhat");

// Contract to deploy
const NFT_CONTRACT_NAME = "NFTContract";
const SWAP_CONTRACT_NAME = "SwapNFT";
let nftContract, swapNFT;

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");

    /// --------------------------------------------------------------------------------------------------
    /// ToDo: Place your deploy code here
    /// --------------------------------------------------------------------------------------------------


    console.log("-- NFT Contract Address:\t", nftContract.address);
    console.log("-- SwapNFT Contract Address:\t", swapNFT.address);  
    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Contracts have been successfully deployed");
    console.log("---------------------------------------------------------------------------------------");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });