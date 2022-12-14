//SPDX-License-Identifier:MIT
pragma solidity 0.8.16;

/// @notice This contract is the proxy contract for SwapNFT
/// @dev If you don't implement proxy, you don't have to implement this code
contract SwapNFT {

    /// State variables
    /// ToDo: Place your private variables here if you need any
    mapping(address => mapping(uint256 => address)) public nftListedBy;
    address public logicContractAddress;

    constructor(address _logicContract) {
        logicContractAddress = _logicContract;
    }

    fallback() external{
        assembly{
            let ptr := mload(0x40) // es el primer espacio de memoria donde puedo empezar a escribir
            // sabiendo que no voy a pisar nada
            calldatacopy(ptr, 0, calldatasize())

            let result := delegatecall(
                gas(),
                sload(logicContractAddress.slot),
                ptr,
                calldatasize(),
                0,
                0
            )

            let size := returndatasize()
            returndatacopy(ptr, 0, size)

            switch result
                case 0{
                    revert(ptr, size)
                }
                default{
                    return (ptr, size)
                }
        }
    } 
}