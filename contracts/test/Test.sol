//SPDX-License-Identifier:MIT
pragma solidity 0.8.16;

import "../interfaces/IERC721TokenReceiver.sol";

//---------------------------------------------------------------------------------------------------------------
//-- IMPORTANT: YOU DO NOT HAVE TO CHANGE ANYTHING IN THIS FILE -------------------------------------------------
//---------------------------------------------------------------------------------------------------------------

contract ValidContract is IERC721TokenReceiver { 
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external returns(bytes4){
        /// ToDo: Place your code here
        return 0x150b7a02;
    }
}

contract InvalidContract is IERC721TokenReceiver { 
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes memory _data) external returns(bytes4){
        /// ToDo: Place your code here
        return 0x11111111;
    }
}