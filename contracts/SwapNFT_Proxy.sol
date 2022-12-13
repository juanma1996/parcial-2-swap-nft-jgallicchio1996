//SPDX-License-Identifier:MIT
pragma solidity 0.8.16;

/// @notice This contract is the proxy contract for SwapNFT
/// @dev If you don't implement proxy, you don't have to implement this code
contract SwapNFT {

    /// State variables
    /// ToDo: Place your private variables here if you need any
    address public logicContractAddress;

    constructor(address _logicContract) {
        logicContractAddress = _logicContract;
    }
}