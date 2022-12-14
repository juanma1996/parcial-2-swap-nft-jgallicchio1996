const { ethers } = require("hardhat");

// Contract to deploy
const NFT_CONTRACT_NAME = "NFTContract";
const SWAP_CONTRACT_NAME = "SwapNFT";
const nftContractPath = "contracts/NFTContract.sol:NFTContract";
const swapNFTPath = "contracts/SwapNFT.sol:SwapNFT";
const swapNFTProxyPath = "contracts/SwapNFT_Proxy.sol:SwapNFT";
let nftContract, swapNFT, swapNFT_Proxy;

async function main() {

    console.log("---------------------------------------------------------------------------------------");
    console.log("-- Deploy contracts process start...");
    console.log("---------------------------------------------------------------------------------------");

        // Get Signer
        const [signer, tokenVault] = await ethers.getSigners();
        const confirmations_number  =  1;
        
        //Get provider for testnet GOERLI
        const accessPoint_URL = process.env.GOERLI_ACCESSPOINT_URL;
    
        const provider = new ethers.providers.JsonRpcProvider(accessPoint_URL);

        const tokenURI = "URL to the collection";
        const name = "TT2 Collection";
        const symbol = "TT2";
    
        // Deploy NFT Contract
        const nftContractFactory = await ethers.getContractFactory(nftContractPath, signer);
        nftContract = await nftContractFactory.deploy(name, symbol, tokenURI);

        // Deploy SwapNFT Contract
        const swapNFTContractFactory = await ethers.getContractFactory(swapNFTPath, signer);
        swapNFT = await swapNFTContractFactory.deploy();

        // Deploy SwapNFT_Proxy Contract
        const swapNFT_ProxyContractFactory = await ethers.getContractFactory(swapNFTProxyPath, signer);
        swapNFT_proxy = await swapNFT_ProxyContractFactory.deploy(swapNFT.address);


    console.log("-- NFT Contract Address:\t", nftContract.address);
    console.log("-- SwapNFT Contract Address:\t", swapNFT.address); 
    console.log("-- SwapNFT_proxy Contract Address:\t", swapNFT_proxy.address);   
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