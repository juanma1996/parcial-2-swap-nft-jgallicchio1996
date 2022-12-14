//SPDX-License-Identifier:MIT
pragma solidity 0.8.16;

import "./interfaces/IERC721TokenReceiver.sol";
import "./interfaces/IERC721.sol";
import "hardhat/console.sol";

/// @notice This contract allow to swap owners between two differents NFT
/// @dev This contract should be implemented with the updatable pattern, with contracts named SwapNFT as proxy and SwapNFT_logic
/// The contract must allow query if a NFT it is listed to be swaped
/// The requirements must be implemented in decreasing order of their cost.
contract SwapNFT is IERC721TokenReceiver {

    /// State variables
    /// ToDo: Place your private variables here if you need any

    /// State mappings
    /// @dev NFT contract => tokenId => original owner address
    mapping(address => mapping(uint256 => address)) public nftListedBy; // NFT contract => tokenId => original owner address


    /// modifiers
    /// ToDo: Place your modifiers here if you need any

    /// @notice Handle the receipt of an NFT
    /// @dev The ERC721 smart contract calls this function on the recipient
    ///  after a `transfer`. This function MAY throw to revert and reject the
    ///  transfer if return other than the magic value.
    ///  Note: The contract address is always the message sender.
    /// @param _operator The address which called `safeTransferFrom` function
    /// @param _from The address which previously owned the token
    /// @param _tokenId The NFT identifier which is being transferred
    /// @param _data Additional data with no specified format
    /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    ///  unless throwing
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external returns(bytes4){
        try IERC721TokenReceiver(msg.sender).onERC721Received(_operator, _from, _tokenId, _data)returns (bytes4){
                return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
            } catch (bytes memory reason) {
                console.log("<<");
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
    }

    /// @notice Publish a `_tokenId` in the contract to be swaped between other `_tokenId` 
    /// from other address. This method has to take ownership over the NFT and listed id for swap.
    /// @dev Throw if the contract is not authorized to operate with the NFT, with 
    /// the message "Approval operation is missing".
    /// @dev Throw if `_tokenId` is not a valid NFT with "Invalid tokenId"
    /// @dev Throw unless `msg.sender` is the current owner of the NFT, with message "Not authorized". 
    /// @param _nftContract The NFT manager contract
    /// @param _tokenId The NFT to swap
    function publishNFT(address _nftContract, uint256 _tokenId) external {
        if (_tokenId < 1 || _tokenId > IERC721(_nftContract).currentTokenID()){
            revert("Invalid tokenId");
        }
        if(IERC721(_nftContract).ownerOf(_tokenId) != msg.sender){
            revert("Not authorized");
        }
        if (IERC721(_nftContract).allowance(_tokenId) != address(this)){
            revert("Approval operation is missing");
        }
        
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);
        nftListedBy[_nftContract][_tokenId] = msg.sender;
    }

    /// @notice Make a swap between `_myTokenId` and the `_swappedTokenID`. This method must 
    /// take ownership over the `_myTokenId` and then swap owners between tokens.
    /// @dev Throws if both NFT has the same owner with "Invalid operation".
    /// @dev Throws if `_myNFTContract` is not a smart contract, with "_myNFTContract is not a smart contract".
    /// @dev Throws if `_swappedTokenIDContract` is not a smart contract, with "_swappedTokenIDContract is not a smart contract".
    /// @dev Throws if `_myTokenId` is not a valid NFT identifier, with "Invalid _myTokenId".
    /// @dev Throws if `_swappedTokenID` is not a published NFT in the contract with "Invalid _swappedTokenID".
    /// @dev Throw unless `msg.sender` is the current NFT owner of `_myTokenId`, with "Not authorized".
    /// @dev Throw if the contract is not authorized to operate with the NFT identifier by _myTokenId, with 
    /// the message "Approval operation is missing".
    /// @param _myNFTContract The manager contract of the NFT '_myTokenId'
    /// @param _myTokenId The NFT to swap
    /// @param _swappedTokenIDContract The manager contract of the NFT '_swappedTokenID'
    /// @param _swappedTokenID The NFT to swap with
    function swapNFT(address _myNFTContract, uint256 _myTokenId, address _swappedTokenIDContract, uint256 _swappedTokenID) external {
        if(!_isSmartContractAddress(_myNFTContract)){
            revert("_myNFTContract is not a smart contract");
        }
        if(!_isSmartContractAddress(_swappedTokenIDContract)){
            revert("_swappedTokenIDContract is not a smart contract");
        }
        if (_myTokenId < 1 || _myTokenId > IERC721(_myNFTContract).currentTokenID()){
            revert("Invalid _myTokenId");
        }
        if (_swappedTokenID < 1 || _swappedTokenID > IERC721(_myNFTContract).currentTokenID()){
            revert("Invalid _swappedTokenID");
        }
        if(IERC721(_myNFTContract).ownerOf(_myTokenId) != msg.sender){
            revert("Not authorized");
        }
        
        if(IERC721(_myNFTContract).ownerOf(_myTokenId) == IERC721(_myNFTContract).ownerOf(_swappedTokenID)){
            revert("Invalid operation");
        }  

        if (IERC721(_myNFTContract).allowance(_myTokenId) != address(this)){
            revert("Approval operation is missing");
        }         
                    
        IERC721(_myNFTContract).safeTransferFrom(msg.sender, address(this), _myTokenId);
        IERC721(_myNFTContract).safeTransferFrom(msg.sender, address(this), _swappedTokenID);
        IERC721(_myNFTContract).safeTransferFrom(address(this), _swappedTokenIDContract, _myTokenId);
        IERC721(_myNFTContract).safeTransferFrom(address(this), _myNFTContract, _swappedTokenID);
    }

    /// @notice Returns the NFT to his original owner if no swap has occurred
    /// @dev Throw unless `msg.sender` is the original owner for the `_tokenId`, with message "Not authorized".
    /// @dev Throws if `_myNFTContract` is not a smart contract, with "_myNFTContract is not a smart contract".
    /// @dev Throw if `_tokenId` is not a published NFT in the contract with "Invalid _tokenId".
    /// @param _myNFTContract The manager contract of the NFT '_tokenId'
    /// @param _tokenId The NFT to withdraw
    function withdrawNFT(address _myNFTContract, uint256 _tokenId) external {
        if(!_isSmartContractAddress(_myNFTContract)){
            revert("_myNFTContract is not a smart contract");
        }
        if (_tokenId < 1 || _tokenId > IERC721(_myNFTContract).currentTokenID()){
            revert("Invalid _tokenId");
        }
        if(nftListedBy[_myNFTContract][_tokenId] != msg.sender){
            revert("Not authorized");
        }       

        IERC721(_myNFTContract).safeTransferFrom(address(this), msg.sender, _tokenId);
    }

    // /// ------------------------------------------------------------------------------------------------------------------------------------------
    // /// PRIVATE FUNCTIONS
    // /// ------------------------------------------------------------------------------------------------------------------------------------------


    function _isSmartContractAddress(address _address) private view returns (bool) {
         bytes32 zeroAccountHash = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
         bytes32 codeHash;    
         assembly { codeHash := extcodehash(_address) }
         return (codeHash != zeroAccountHash && codeHash != 0x0);
     }
}