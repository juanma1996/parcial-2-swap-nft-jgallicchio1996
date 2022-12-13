//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/// @notice Interface of NFT contract
/// @dev Add the modifiers to the methods that you require
interface IERC721 {
    function name() external view returns (string memory _name);
    function symbol() external view returns (string memory _symbol);
    function tokenURI(uint256 _tokenId) external view returns (string memory);
    function totalSupply() external view returns (uint256);
    function currentTokenID() external view returns (uint256);
    function owner() external view returns (address);
    function balanceOf(address _owner) external view returns (uint256);
    function ownerOf(uint256 _tokenId) external view returns (address);
    function allowance(uint256 _tokenId) external view returns (address);
    function safeMint(address _to) external payable;
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external;
    function approve(address _approved, uint256 _tokenId) external;
    function withdrawFees(address _to) external;
}