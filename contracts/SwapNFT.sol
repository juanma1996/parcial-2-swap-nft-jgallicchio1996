//SPDX-License-Identifier:MIT
pragma solidity 0.8.16;

import "./interfaces/IERC721TokenReceiver.sol";

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
        /// ToDo: Place your code here
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
        /// ToDo: Place your code here
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
        /// ToDo: Place your code here
    }

    /// @notice Returns the NFT to his original owner if no swap has occurred
    /// @dev Throw unless `msg.sender` is the original owner for the `_tokenId`, with message "Not authorized".
    /// @dev Throws if `_myNFTContract` is not a smart contract, with "_myNFTContract is not a smart contract".
    /// @dev Throw if `_tokenId` is not a published NFT in the contract with "Invalid _tokenId".
    /// @param _myNFTContract The manager contract of the NFT '_tokenId'
    /// @param _tokenId The NFT to withdraw
    function withdrawNFT(address _myNFTContract, uint256 _tokenId) external {
        /// ToDo: Place your code here
    }
}