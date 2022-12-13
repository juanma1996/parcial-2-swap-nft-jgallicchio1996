/// --------------------------------------------------------------------------------------------------
/// ToDo: Place your contract test code here
/// --------------------------------------------------------------------------------------------------
const { ethers } = require("hardhat");

const fs = require("fs");
const path = require("path");
require('dotenv').config();

const chai = require("chai");
const { solidity } = require( "ethereum-waffle");
chai.use(solidity);
const { expect } = chai;

const nftContractPath = "contracts/NFTContract.sol:NFTContract";
const SwapNFTContractPath = "contracts/SwapNFT.sol:SwapNFT";

const confirmations_number  =  1;
const zeroAddress = '0x0000000000000000000000000000000000000000';
let nftContractFactory, swapNFTContractFactory, nftContractInstance, swapNFTContractInstance, nftContractInstance2;
let signer, account1, account2, account3, provider;
let validContractInstance, invalidContractInstance, swapNFTContractLogicAddress;

describe("Contract tests", () => {
    before(async () => {
        console.log("-----------------------------------------------------------------------------------");
        console.log(" -- Contract tests start");
        console.log("-----------------------------------------------------------------------------------");

        // Get Signer and provider
        [signer, account1, account2, account3] = await ethers.getSigners();
        provider = ethers.provider;

        // Constructor parameters
        const name = "test_Name";
        const symbol = "TT2";
        const tokenURI = "test_tokenURI";

        // Deploy contracts
        nftContractFactory = await ethers.getContractFactory(nftContractPath, signer);
        swapNFTContractFactory = await ethers.getContractFactory(SwapNFTContractPath, signer);

        nftContractInstance = await nftContractFactory.deploy(name, symbol, tokenURI);
        nftContractInstance2 = await nftContractFactory.deploy(name, symbol, tokenURI);
        swapNFTContractInstance = await swapNFTContractFactory.deploy();        

        const validContractPath = "contracts/test/Test.sol:ValidContract";
        const invalidContractPath = "contracts/test/Test.sol:InvalidContract";
        const validContractFactory = await ethers.getContractFactory(validContractPath, signer);
        const invalidContractFactory = await ethers.getContractFactory(invalidContractPath, signer);
        validContractInstance = await validContractFactory.deploy();
        invalidContractInstance = await invalidContractFactory.deploy();

        if(process.env.WITH_PROXY == 1) {
            swapNFTContractLogicAddress = swapNFTContractInstance.address;
            const SwapNFTProxyContractPath = "contracts/SwapNFT_Proxy.sol:SwapNFT";
            const swapNFTProxyContractFactory = await ethers.getContractFactory(SwapNFTProxyContractPath, signer);
            swapNFTContractInstance = await swapNFTProxyContractFactory.deploy(swapNFTContractLogicAddress);

            const swapNFTContractABIPath = path.resolve(process.cwd(), "artifacts/contracts/SwapNFT") + ".sol/SwapNFT.json";
            const swapNFTArtifact = JSON.parse(fs.readFileSync(swapNFTContractABIPath, "utf8"));
            swapNFTContractInstance = new ethers.Contract(swapNFTContractInstance.address, swapNFTArtifact.abi, signer);
        }
        
    });

    describe("ERC-721 tests", () => {
        describe("Constructor tests", () => {
            it("Try send empty name", async () => {
                await expect(nftContractFactory.deploy("", "tes", "test")).to.be.revertedWith("_name, _symbol and _tokenURI are mandatory parameters");
            });

            it("Try send empty symbol", async () => {
                await expect(nftContractFactory.deploy("test", "", "test")).to.be.revertedWith("_name, _symbol and _tokenURI are mandatory parameters");
            });

            it("Try send empty tokenURI", async () => {
                await expect(nftContractFactory.deploy("test", "tes", "")).to.be.revertedWith("_name, _symbol and _tokenURI are mandatory parameters");
            });

            it("Try send a symbol longer than 3 characters", async () => {
                await expect(nftContractFactory.deploy("test", "test", "test")).to.be.revertedWith("Invalid symbol");
            });

            it("Evaluate initialization", async () => {
                // Expected values
                const expectedName = "test_Name";
                const expectedSymbol = "TT2";
                const expectedTokenURI = "test_tokenURI";

                // Recived values
                const recivedName = await nftContractInstance.name();
                const recivedSymbol = await nftContractInstance.symbol();
                const recivedTokenURI = await nftContractInstance.tokenURI();
                            
                expect(recivedName).to.be.equals(expectedName);
                expect(recivedSymbol).to.be.equals(expectedSymbol);
                expect(recivedTokenURI).to.be.equals(expectedTokenURI);
            });
        });

        describe("SafeMint tests", () => {
            it("Try safeMint with empty _recipient", async () => {
                await expect(nftContractInstance.safeMint(zeroAddress)).to.be.revertedWith("Invalid address");
            });

            it("Try safeMint with zero value", async () => {
                const payAmount = ethers.utils.parseEther("0");
                await expect(nftContractInstance.safeMint(signer.address, { value: payAmount })).to.be.revertedWith("Mint has a cost of 0.01 eth");
            });

            it("safeMint an NFT", async () => {
                const payAmount = ethers.utils.parseEther("0.01");

                const totalSupplyBefore = await nftContractInstance.totalSupply();
                const currentTokenIDBefore = await nftContractInstance.currentTokenID();
                const balanceOfBefore = await nftContractInstance.balanceOf(signer.address);
                const previousOwner = await nftContractInstance.ownerOf(totalSupplyBefore);
                const contractBalanceBefore = await provider.getBalance(nftContractInstance.address);

                const tx = await nftContractInstance.safeMint(signer.address, { value: payAmount });
                
                const tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const totalSupplyAfter = await nftContractInstance.totalSupply();
                const currentTokenIDAfter = await nftContractInstance.currentTokenID();
                const balanceOfAfter = await nftContractInstance.balanceOf(signer.address);
                const currentOwner = await nftContractInstance.ownerOf(totalSupplyBefore);
                const newOwner = await nftContractInstance.ownerOf(totalSupplyAfter);
                const contractBalanceAfter = await provider.getBalance(nftContractInstance.address);
                
                expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore) + 1);
                expect(parseInt(currentTokenIDAfter)).to.be.equals(parseInt(currentTokenIDBefore) + 1);
                expect(parseInt(balanceOfAfter)).to.be.equals(parseInt(balanceOfBefore) + 1);
                expect(previousOwner).to.be.equals(zeroAddress);
                expect(currentOwner).to.be.equals(zeroAddress);
                expect(newOwner).to.be.equals(signer.address);
                expect(contractBalanceBefore).to.be.equals(ethers.utils.parseEther("0"));
                expect(contractBalanceAfter).to.be.equals(payAmount);
            });

            it("safeMint an NFT to different _to account", async () => {
                const payAmount = ethers.utils.parseEther("0.01");

                const totalSupplyBefore = await nftContractInstance.totalSupply();
                const currentTokenIDBefore = await nftContractInstance.currentTokenID();
                const signerBalanceBefore = await nftContractInstance.balanceOf(signer.address);
                const balanceOfBefore = await nftContractInstance.balanceOf(account1.address);
                const previousOwner = await nftContractInstance.ownerOf(currentTokenIDBefore.add(1)); // new instance
                const contractBalanceBefore = await provider.getBalance(nftContractInstance.address);

                const tx = await nftContractInstance.safeMint(account1.address, { value: payAmount });
                
                const tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const totalSupplyAfter = await nftContractInstance.totalSupply();
                const currentTokenIDAfter = await nftContractInstance.currentTokenID();
                const signerBalanceAfter = await nftContractInstance.balanceOf(signer.address);
                const balanceOfAfter = await nftContractInstance.balanceOf(account1.address);
                const currentOwner = await nftContractInstance.ownerOf(currentTokenIDAfter);
                                const contractBalanceAfter = await provider.getBalance(nftContractInstance.address);
                
                expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore) + 1);
                expect(parseInt(currentTokenIDAfter)).to.be.equals(parseInt(currentTokenIDBefore) + 1);
                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore));
                expect(parseInt(balanceOfAfter)).to.be.equals(parseInt(balanceOfBefore) + 1);
                expect(previousOwner).to.be.equals(zeroAddress);
                expect(currentOwner).to.be.equals(account1.address);
                expect(contractBalanceBefore).to.be.equals(payAmount);
                expect(contractBalanceAfter).to.be.equals(payAmount.mul(2));
            });

            it("Try safeMint to an invalid contract", async () => {
                const payAmount = ethers.utils.parseEther("0.01");
                await expect(nftContractInstance.safeMint(invalidContractInstance.address, { value: payAmount })).to.be.revertedWith("Invalid contract");
            });

            it("safeMint an NFT to a valid contract", async () => {
                const payAmount = ethers.utils.parseEther("0.01");

                const totalSupplyBefore = await nftContractInstance.totalSupply();
                const currentTokenIDBefore = await nftContractInstance.currentTokenID();
                const signerBalanceBefore = await nftContractInstance.balanceOf(signer.address);
                const balanceOfBefore = await nftContractInstance.balanceOf(validContractInstance.address);
                const previousOwner = await nftContractInstance.ownerOf(currentTokenIDBefore.add(1)); // new instance
                const contractBalanceBefore = await provider.getBalance(nftContractInstance.address);

                const tx = await nftContractInstance.safeMint(validContractInstance.address, { value: payAmount });
                
                const tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const totalSupplyAfter = await nftContractInstance.totalSupply();
                const currentTokenIDAfter = await nftContractInstance.currentTokenID();
                const signerBalanceAfter = await nftContractInstance.balanceOf(signer.address);
                const balanceOfAfter = await nftContractInstance.balanceOf(validContractInstance.address);
                const currentOwner = await nftContractInstance.ownerOf(currentTokenIDAfter);
                const contractBalanceAfter = await provider.getBalance(nftContractInstance.address);
                
                expect(parseInt(totalSupplyAfter)).to.be.equals(parseInt(totalSupplyBefore) + 1);
                expect(parseInt(currentTokenIDAfter)).to.be.equals(parseInt(currentTokenIDBefore) + 1);
                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore));
                expect(parseInt(balanceOfAfter)).to.be.equals(parseInt(balanceOfBefore) + 1);
                expect(previousOwner).to.be.equals(zeroAddress);
                expect(currentOwner).to.be.equals(validContractInstance.address);
                expect(contractBalanceBefore).to.be.equals(payAmount.mul(2));
                expect(contractBalanceAfter).to.be.equals(payAmount.mul(3));
            });
        });

        describe("SafeTransferFrom tests", () => {
            it("Try SafeTransferFrom from zero address", async () => {
                const tokenID = 1
                await expect(nftContractInstance.safeTransferFrom(zeroAddress, account1.address, tokenID)).to.be.revertedWith("Not the owner");
            });

            it("Try SafeTransferFrom from address different that the owner", async () => {
                const tokenID = 1
                await expect(nftContractInstance.safeTransferFrom(account1.address, account2.address, tokenID)).to.be.revertedWith("Not the owner");
            });
            
            it("Try SafeTransferFrom to zero address", async () => {
                const tokenID = 1
                await expect(nftContractInstance.safeTransferFrom(signer.address, zeroAddress, tokenID)).to.be.revertedWith("Invalid address");
            });

            it("Try SafeTransferFrom zero token ID", async () => {
                const tokenID = 0;
                await expect(nftContractInstance.safeTransferFrom(signer.address, account1.address, tokenID)).to.be.revertedWith("Invalid tokenId");
            });

            it("Try SafeTransferFrom invalid token ID", async () => {
                const tokenID = await nftContractInstance.currentTokenID() + 1;
                await expect(nftContractInstance.safeTransferFrom(signer.address, account1.address, tokenID)).to.be.revertedWith("Invalid tokenId");
            });

            it("Try SafeTransferFrom from no authorized account", async () => {
                const tokenID = 1
                const nftContractInstanceNew = await nftContractInstance.connect(account1); 
                await expect(nftContractInstanceNew.safeTransferFrom(signer.address, account2.address, tokenID)).to.be.revertedWith("Not authorized");
            });
            
            it("Try SafeTransferFrom to an invalid contract", async () => {
                const currentTokenID = 1
                await expect(nftContractInstance.safeTransferFrom(signer.address, invalidContractInstance.address, currentTokenID)).to.be.revertedWith("Invalid contract");
            });

            it("SafeTransferFrom tokenId 1 from signer account to account1", async () => {
                const currentTokenID = 1
                const signerBalanceBefore = await nftContractInstance.balanceOf(signer.address);
                const account1BalanceBefore = await nftContractInstance.balanceOf(account1.address);
                const originalOwner = await nftContractInstance.ownerOf(currentTokenID);
                
                const tx = await nftContractInstance.safeTransferFrom(signer.address, account1.address, currentTokenID);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await nftContractInstance.balanceOf(signer.address);
                const account1BalanceAfter = await nftContractInstance.balanceOf(account1.address);
                const newOwner = await nftContractInstance.ownerOf(currentTokenID);
                const allowanceAfter = await nftContractInstance.allowance(currentTokenID);
                
                
                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) - 1);
                expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) + 1);
                expect(originalOwner).to.be.equals(signer.address);
                expect(newOwner).to.be.equals(account1.address);
                expect(allowanceAfter).to.be.equals(zeroAddress);
            });

            it("SafeTransferFrom tokenId 1 from account1 to valid contract validContractINstance", async () => {
                const currentTokenID = 1
                const account1BalanceBefore = await nftContractInstance.balanceOf(account1.address);
                const contractBalanceBefore = await nftContractInstance.balanceOf(validContractInstance.address);
                const originalOwner = await nftContractInstance.ownerOf(currentTokenID);
                
                const newInstance = nftContractInstance.connect(account1);
                const tx = await newInstance.safeTransferFrom(account1.address, validContractInstance.address, currentTokenID);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const account1BalanceAfter = await nftContractInstance.balanceOf(account1.address);
                const contractBalanceAfter = await nftContractInstance.balanceOf(validContractInstance.address);
                const newOwner = await nftContractInstance.ownerOf(currentTokenID);
                const allowanceAfter = await nftContractInstance.allowance(currentTokenID);
                
                
                expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) - 1);
                expect(parseInt(contractBalanceAfter)).to.be.equals(parseInt(contractBalanceBefore) + 1);
                expect(originalOwner).to.be.equals(account1.address);
                expect(newOwner).to.be.equals(validContractInstance.address);
                expect(allowanceAfter).to.be.equals(zeroAddress);
            });
        });

        describe("Approve tests", () => {
            it("Try approve to zero tokenID", async () => {
                const tokenID = 0;
                await expect(nftContractInstance.approve(account1.address, tokenID)).to.be.revertedWith("Invalid tokenId");
            });

            it("Try approve to invalid tokenID", async () => {
                const tokenID = await nftContractInstance.currentTokenID() + 1;
                await expect(nftContractInstance.approve(account1.address, tokenID)).to.be.revertedWith("Invalid tokenId");
            });

            it("Try approve without authorization", async () => {
                const tokenID = await nftContractInstance.currentTokenID();
                await expect(nftContractInstance.approve(account2.address, tokenID)).to.be.revertedWith("Not authorized");
            });

            it("Set approve signer account for tokenID 2", async () => {
                const tokenID = 2;
                const allowanceBefore = await nftContractInstance.allowance(tokenID);
                
                const nftContractInstanceNew = await nftContractInstance.connect(account1);
                const tx = await nftContractInstanceNew.approve(signer.address, tokenID);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const allowanceAfter = await nftContractInstanceNew.allowance(tokenID);
                expect(allowanceBefore).to.be.equals(zeroAddress);
                expect(allowanceAfter).to.be.equals(signer.address);
            });

            it("Try approve on a token id with a user not authorized", async () => {
                const tokenID = 1;
                //const nftContractInstanceNew = await nftContractInstance.connect(account2);
                await expect(nftContractInstance.approve(account3.address, tokenID)).to.be.revertedWith("Not authorized");
            });

            it("Set approve for token 2 for an approved account", async () => {
                const tokenID = 2;
                const allowanceBefore = await nftContractInstance.allowance(tokenID);
                const tx = await nftContractInstance.approve(account2.address, tokenID);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const allowanceAfter = await nftContractInstance.allowance(tokenID);
                expect(allowanceBefore).to.be.equals(signer.address);
                expect(allowanceAfter).to.be.equals(account2.address);
            });

            it("SafeTransferFrom token Id 2 from account1 to signer with account2 approved address", async () => {
                const currentTokenID = 2;
                const signerBalanceBefore = await nftContractInstance.balanceOf(signer.address);
                const account1BalanceBefore = await nftContractInstance.balanceOf(account1.address);
                const originalOwner = await nftContractInstance.ownerOf(currentTokenID);
                const allowanceBefore = await nftContractInstance.allowance(currentTokenID);
                
                const nftContractInstanceNew = await nftContractInstance.connect(account2);
                const tx = await nftContractInstanceNew.safeTransferFrom(account1.address, signer.address, currentTokenID);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await nftContractInstance.balanceOf(signer.address);
                const account1BalanceAfter = await nftContractInstance.balanceOf(account1.address);
                const newOwner = await nftContractInstance.ownerOf(currentTokenID);
                const allowanceAfter = await nftContractInstanceNew.allowance(currentTokenID);
                
                
                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) + 1);
                expect(parseInt(account1BalanceAfter)).to.be.equals(parseInt(account1BalanceBefore) - 1);
                expect(originalOwner).to.be.equals(account1.address);
                expect(newOwner).to.be.equals(signer.address);
                expect(allowanceBefore).to.be.equals(account2.address);
                expect(allowanceAfter).to.be.equals(zeroAddress);
            });

            it("Set approve for tokenID 2 for account3 and remove it", async () => {
                const tokenID = 2;
                const allowanceBefore = await nftContractInstance.allowance(tokenID);
                const tx = await nftContractInstance.approve(account3.address, tokenID);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const allowanceAfter = await nftContractInstance.allowance(tokenID);
                expect(allowanceBefore).to.be.equals(zeroAddress);
                expect(allowanceAfter).to.be.equals(account3.address);

                const tx2 = await nftContractInstance.approve(zeroAddress, tokenID);

                tx_result2 = await provider.waitForTransaction(tx2.hash, confirmations_number);
                if(tx_result2.confirmations < 0 || tx_result2 === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check result
                const allowanceFinal = await nftContractInstance.allowance(tokenID);
                expect(allowanceFinal).to.be.equals(zeroAddress);
            });
        });

        describe("withdrawFees tests", () => {
            it("Try withdrawFees to zero address", async () => {
                await expect(nftContractInstance.withdrawFees(zeroAddress)).to.be.revertedWith("Invalid destination address");
            });

            it("Try withdrawFees with not authoriced account", async () => {
                const newInstance = await nftContractInstance.connect(account1);
                await expect(newInstance.withdrawFees(account1.address)).to.be.revertedWith("Not authorized");
            });

            it("withdrawFees from NFT Contract", async () => {
                const contractBalanceBefore = await provider.getBalance(nftContractInstance.address);
                const account1BalanceBefore = await provider.getBalance(account1.address);
                
                const tx = await nftContractInstance.withdrawFees(account1.address);

                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const contractBalanceAfter = await provider.getBalance(nftContractInstance.address);
                const account1BalanceAfter = await provider.getBalance(account1.address);
                
                expect(contractBalanceBefore).to.be.equals(ethers.utils.parseEther("0.03"));
                expect(contractBalanceAfter).to.be.equals(ethers.utils.parseEther("0"));
                expect(account1BalanceAfter).to.be.equals(ethers.utils.parseEther("0.03").add(account1BalanceBefore));
            });

            it("Try withdrawFees with insufficient balance", async () => {
                await expect(nftContractInstance.withdrawFees(account2.address)).to.be.revertedWith("Insufficient balance");
            });
        });
    });

    /// --------------------------------------------------------------------------------------------------------------
    /// SwapNFT Test
    /// --------------------------------------------------------------------------------------------------------------

    describe("SwapNFT tests", () => {
        describe("onERC721Received tests", () => {
            it("Try onERC721Received on contract", async () => {
                const _operator = zeroAddress;
                const _from = zeroAddress;
                const _tokenId = 1;
                const _data = [];
                const expectedResult = "0x150b7a02";
                const result = await swapNFTContractInstance.onERC721Received(_operator, _from, _tokenId, _data);
                expect(result.data.substring(0, 10)).to.be.equals(expectedResult);
            });
        });

        describe("publishNFT tests", () => {
            it("Try publishNFT with zero tokenId", async () => {
                const tokenID = 0
                await expect(swapNFTContractInstance.publishNFT(nftContractInstance.address, tokenID)).to.be.revertedWith("Invalid tokenId");
            });

            it("Try publishNFT with Invalid tokenId", async () => {
                const tokenID = await nftContractInstance.totalSupply() + 1;
                await expect(swapNFTContractInstance.publishNFT(nftContractInstance.address, tokenID)).to.be.revertedWith("Invalid tokenId");
            });

            it("Try publishNFT with an account not authorized", async () => {
                const tokenID = 1
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account3);
                await expect(swapNFTContractInstanceNew.publishNFT(nftContractInstance.address, tokenID)).to.be.revertedWith("Not authorized");
            });

            it("Try publishNFT without the approval operation", async () => {
                const tokenID = 2
                await expect(swapNFTContractInstance.publishNFT(nftContractInstance.address, tokenID)).to.be.revertedWith("Approval operation is missing");
            });

            it("publishNFT test", async () => {
                const currentTokenID = 2
                const signerBalanceBefore = await nftContractInstance.balanceOf(signer.address);
                const contractBalanceBefore = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                const originalOwner = await nftContractInstance.ownerOf(currentTokenID);

                // Approve NFTContract
                let tx = await nftContractInstance.approve(swapNFTContractInstance.address, currentTokenID);
                let tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                tx = await swapNFTContractInstance.publishNFT(nftContractInstance.address, currentTokenID);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await nftContractInstance.balanceOf(signer.address);
                const contractBalanceAfter = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                const newOwner = await nftContractInstance.ownerOf(currentTokenID);
                const allowanceAfter = await nftContractInstance.allowance(currentTokenID);
                
                
                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) - 1);
                expect(parseInt(contractBalanceAfter)).to.be.equals(parseInt(contractBalanceBefore) + 1);
                expect(originalOwner).to.be.equals(signer.address);
                expect(newOwner).to.be.equals(swapNFTContractInstance.address);
                expect(allowanceAfter).to.be.equals(zeroAddress);
            });
        });

        describe("swapNFT tests", () => {
            it("Try swapNFT with Invalid _myNFTContract parameter", async () => {
                const myTokenId = 2;
                const swappedTokenID = 1;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                await expect(swapNFTContractInstanceNew.swapNFT(zeroAddress, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("_myNFTContract is not a smart contract");
            });

            it("Try swapNFT with Invalid _swappedTokenIDContract parameter", async () => {
                const myTokenId = 2;
                const swappedTokenID = 1;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                await expect(swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, zeroAddress, swappedTokenID)).to.be.revertedWith("_swappedTokenIDContract is not a smart contract");
            });
            
            it("Try swapNFT with Invalid _myTokenId: zero value", async () => {
                const myTokenId = 0;
                const swappedTokenID = 1;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                await expect(swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Invalid _myTokenId");
            });

            it("Try swapNFT with Invalid _myTokenId: max value", async () => {
                const myTokenId = await nftContractInstance.totalSupply() + 1;
                const swappedTokenID = 1;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                await expect(swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Invalid _myTokenId");
            });

            it("Try swapNFT with Invalid _swappedTokenID: Zero value", async () => {
                const myTokenId = 2;
                const swappedTokenID = 0;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                await expect(swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Invalid _swappedTokenID");
            });

            it("Try swapNFT with Invalid _swappedTokenID: max value", async () => {
                const myTokenId = 2;
                const swappedTokenID = await nftContractInstance.totalSupply() + 1;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                await expect(swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Invalid _swappedTokenID");
            });

            it("Try swapNFT with an account not authorized", async () => {
                const myTokenId = 3;
                const swappedTokenID = 2;
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account3);
                await expect(swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Not authorized");
            });

            it("Try swapNFT with an account not approved", async () => {
                // safeMint aditional NFT
                const payAmount = ethers.utils.parseEther("0.01");
                const tx = await nftContractInstance.safeMint(account2.address, { value: payAmount }); // TokenID 4
                const tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const myTokenId = 4;
                const swappedTokenID = 2;
                const swapNFTContractNewInstance = await swapNFTContractInstance.connect(account2); 
                await expect(swapNFTContractNewInstance.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Approval operation is missing");
            });

            it("Try swapNFT with Invalid operation: same owner", async () => {
                // safeMint aditional NFT
                const payAmount = ethers.utils.parseEther("0.01");
                const tx = await nftContractInstance.safeMint(signer.address, { value: payAmount }); // TokenID 5
                const tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const myTokenId = 5;
                const swappedTokenID = 2;
                await expect(swapNFTContractInstance.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)).to.be.revertedWith("Invalid operation");
            });

            it("swapNFT test", async () => {
                const myTokenId = 4;
                const swappedTokenID = 2;

                const signerBalanceBefore = await nftContractInstance.balanceOf(signer.address);
                const account2BalanceBefore = await nftContractInstance.balanceOf(account2.address);
                const nftContractBalanceBefore = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                const swappedTokenIDOriginalOwner = await swapNFTContractInstance.nftListedBy(nftContractInstance.address, swappedTokenID);
                const originalOwnerBalanceBefore = await nftContractInstance.balanceOf(swappedTokenIDOriginalOwner);

                const myTokenIdOwnerBefore = await nftContractInstance.ownerOf(myTokenId);
                const swappedTokenIDOwnerBefore = await nftContractInstance.ownerOf(swappedTokenID);

                // Approve NFTContract
                const nftContractInstanceNew = await nftContractInstance.connect(account2);
                let tx = await nftContractInstanceNew.approve(swapNFTContractInstance.address, myTokenId);
                let tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account2);
                tx = await swapNFTContractInstanceNew.swapNFT(nftContractInstance.address, myTokenId, nftContractInstance.address, swappedTokenID)
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const signerBalanceAfter = await nftContractInstance.balanceOf(signer.address);
                const account2BalanceAfter = await nftContractInstance.balanceOf(account2.address);
                const nftContractBalanceAfter = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                const originalOwnerBalanceAfter = await nftContractInstance.balanceOf(swappedTokenIDOriginalOwner);
                const myTokenIdOwnerAfter = await nftContractInstance.ownerOf(myTokenId);
                const swappedTokenIDOwnerAfter = await nftContractInstance.ownerOf(swappedTokenID);
                
                expect(parseInt(signerBalanceAfter)).to.be.equals(parseInt(signerBalanceBefore) + 1);
                expect(parseInt(account2BalanceAfter)).to.be.equals(parseInt(account2BalanceBefore));
                expect(parseInt(nftContractBalanceAfter)).to.be.equals(parseInt(nftContractBalanceBefore) - 1);
                expect(parseInt(originalOwnerBalanceAfter)).to.be.equals(parseInt(originalOwnerBalanceBefore) + 1);
                expect(myTokenIdOwnerBefore).to.be.equals(account2.address);
                expect(swappedTokenIDOwnerBefore).to.be.equals(swapNFTContractInstance.address);
                expect(myTokenIdOwnerAfter).to.be.equals(signer.address);
                expect(swappedTokenIDOwnerAfter).to.be.equals(account2.address);
            }); 

            it("swapNFT test between different contracts", async () => {
                // safeMint an NFT in nftContractInstance2
                const payAmount = ethers.utils.parseEther("0.01");
                let tx = await nftContractInstance2.safeMint(account1.address, { value: payAmount }); // TokenID 1 for account1
                let tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Publish NFT to swap
                const myTokenId = 5;        // In nftContractINstance owned by signer 
                const swappedTokenID = 1;   // in nftContractInstance2 ownedby account1
                tx = await nftContractInstance.approve(swapNFTContractInstance.address, myTokenId);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                tx = await swapNFTContractInstance.publishNFT(nftContractInstance.address, myTokenId);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Values before
                const signerBalanceBefore_instance1 = await nftContractInstance.balanceOf(signer.address);
                const signerBalanceBefore_instance2 = await nftContractInstance2.balanceOf(signer.address);

                const account1BalanceBefore_instance1 = await nftContractInstance.balanceOf(account1.address);
                const account1BalanceBefore_instance2 = await nftContractInstance2.balanceOf(account1.address);

                const nftContractBalanceBefore_instance1 = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                const nftContractBalanceBefore_instance2 = await nftContractInstance2.balanceOf(swapNFTContractInstance.address);
                
                const myTokenIdOwnerBefore = await nftContractInstance.ownerOf(myTokenId);
                const swappedTokenIDOwnerBefore = await nftContractInstance2.ownerOf(swappedTokenID);

                // Approve NFTContract
                const nftContractInstance2New = await nftContractInstance2.connect(account1);
                tx = await nftContractInstance2New.approve(swapNFTContractInstance.address, swappedTokenID);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Make the swap
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account1);
                tx = await swapNFTContractInstanceNew.swapNFT(nftContractInstance2.address, swappedTokenID, nftContractInstance.address, myTokenId)
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check results
                const signerBalanceAfter_instance1 = await nftContractInstance.balanceOf(signer.address);
                const signerBalanceAfter_instance2 = await nftContractInstance2.balanceOf(signer.address);

                const account1BalanceAfter_instance1 = await nftContractInstance.balanceOf(account1.address);
                const account1BalanceAfter_instance2 = await nftContractInstance2.balanceOf(account1.address);

                const nftContractBalanceAfter_instance1 = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                const nftContractBalanceAfter_instance2 = await nftContractInstance2.balanceOf(swapNFTContractInstance.address);
                
                const myTokenIdOwnerAfter = await nftContractInstance.ownerOf(myTokenId);
                const swappedTokenIDOwnerAfter = await nftContractInstance2.ownerOf(swappedTokenID);


                expect(parseInt(signerBalanceAfter_instance1)).to.be.equals(parseInt(signerBalanceBefore_instance1));
                expect(parseInt(signerBalanceAfter_instance2)).to.be.equals(parseInt(signerBalanceBefore_instance2) + 1);

                expect(parseInt(account1BalanceAfter_instance1)).to.be.equals(parseInt(account1BalanceBefore_instance1) + 1);
                expect(parseInt(account1BalanceAfter_instance2)).to.be.equals(parseInt(account1BalanceBefore_instance2) - 1);

                expect(parseInt(nftContractBalanceAfter_instance1)).to.be.equals(parseInt(nftContractBalanceBefore_instance1) - 1);
                expect(parseInt(nftContractBalanceAfter_instance2)).to.be.equals(parseInt(nftContractBalanceBefore_instance2));

                expect(myTokenIdOwnerBefore).to.be.equals(swapNFTContractInstance.address);
                expect(myTokenIdOwnerAfter).to.be.equals(account1.address);

                expect(swappedTokenIDOwnerBefore).to.be.equals(account1.address);
                expect(swappedTokenIDOwnerAfter).to.be.equals(signer.address);
            }); 
        });

        describe("withdrawNFT tests", () => {
            it("Try withdrawNFT with Invalid _myNFTContract parameter", async () => {
                const _myNFTContract = zeroAddress;
                const _tokenId = 2;
                await expect(swapNFTContractInstance.withdrawNFT(_myNFTContract, _tokenId)).to.be.revertedWith("_myNFTContract is not a smart contract");
            });
            
            it("Try withdrawNFT with Invalid _myTokenId: zero value", async () => {
                const _myNFTContract = nftContractInstance.address;
                const _tokenId = 0;
                await expect(swapNFTContractInstance.withdrawNFT(_myNFTContract, _tokenId)).to.be.revertedWith("Invalid _tokenId");
            });

            it("Try withdrawNFT with Invalid owner", async () => {
                // safeMint aditional NFT
                const payAmount = ethers.utils.parseEther("0.01");
                let tx = await nftContractInstance.safeMint(account3.address, { value: payAmount }); // TokenID 6
                let tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const _myNFTContract = nftContractInstance.address;
                const _tokenId = 6;

                const nftContractNewInstance = await nftContractInstance.connect(account3); 
                tx = await nftContractNewInstance.approve(swapNFTContractInstance.address, _tokenId);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                const swapNFTContractNewInstance = await swapNFTContractInstance.connect(account3); 
                tx = await swapNFTContractNewInstance.publishNFT(nftContractInstance.address, _tokenId);
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Try withdraw with an account not the owner
                await expect(swapNFTContractInstance.withdrawNFT(_myNFTContract, _tokenId)).to.be.revertedWith("Not authorized");
            });

            it("withdrawNFT with valid owner", async () => {
                const _myNFTContract = nftContractInstance.address;
                const _tokenId = 6;

                const account3BalanceBefore = await nftContractInstance.balanceOf(account3.address);
                const nftContractBalanceBefore = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
            
                const swapNFTContractInstanceNew = await swapNFTContractInstance.connect(account3);
                tx = await swapNFTContractInstanceNew.withdrawNFT(_myNFTContract, _tokenId)
                tx_result = await provider.waitForTransaction(tx.hash, confirmations_number);
                if(tx_result.confirmations < 0 || tx_result === undefined) {
                    throw new Error("Transaction failed");
                }

                // Check balance
                const account3BalanceAfter = await nftContractInstance.balanceOf(account3.address);
                const nftContractBalanceAfter = await nftContractInstance.balanceOf(swapNFTContractInstance.address);
                
                expect(parseInt(nftContractBalanceAfter)).to.be.equals(parseInt(nftContractBalanceBefore) - 1);
                expect(parseInt(account3BalanceAfter)).to.be.equals(parseInt(account3BalanceBefore) + 1);
            });
        });

        /// --------------------------------------------------------------------------------------------------------------
        /// Proxy test
        /// --------------------------------------------------------------------------------------------------------------

        describe("proxy tests", () => {
            it("Get logic contract address test", async () => {
                const swapNFTproxyABIPath = path.resolve(process.cwd(), "artifacts/contracts/SwapNFT_Proxy") + ".sol/SwapNFT.json";
                const swapNFTProxyArtifact = JSON.parse(fs.readFileSync(swapNFTproxyABIPath, "utf8"));
                swapNFTProxyContractInstance = new ethers.Contract(swapNFTContractInstance.address, swapNFTProxyArtifact.abi, signer);


                const expectedLogicContractAddress = swapNFTContractLogicAddress;
                const resultLogicContractAddress = await swapNFTProxyContractInstance.logicContractAddress();
                expect(resultLogicContractAddress).to.be.equals(expectedLogicContractAddress);
            });

            it("Try Logic contract test", async () => {
                const swapNFTLogicABIPath = path.resolve(process.cwd(), "artifacts/contracts/SwapNFT") + ".sol/SwapNFT.json";
                const swapNFTLogicArtifact = JSON.parse(fs.readFileSync(swapNFTLogicABIPath, "utf8"));
                const swapNFTLogicContractInstance = new ethers.Contract(swapNFTContractLogicAddress, swapNFTLogicArtifact.abi, signer);
              
                const _operator = zeroAddress;
                const _from = zeroAddress;
                const _tokenId = 1;
                const _data = [];
                const expectedResult = "0x150b7a02";
                const result = await swapNFTLogicContractInstance.onERC721Received(_operator, _from, _tokenId, _data);
                expect(result.data.substring(0, 10)).to.be.equals(expectedResult);
            });
        });
    });
});