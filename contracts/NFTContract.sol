//SPDX-License-Identifier:MIT
pragma solidity 0.8.16;

import "./interfaces/IERC721TokenReceiver.sol";

/// @notice This contract allow to mint, transfer and manage NFT
/// @dev The requirements must be implemented in decreasing order of their cost.
contract NFTContract {

    /// State variables
    string public name;
    string public symbol;
    string public tokenURI;
    uint256 public totalSupply;     // The number of NFT minted
    uint256 public currentTokenID;  // First NFT must be index 1
    address public owner;

    /// State mappings
    mapping(address => uint256) public balanceOf;   // NFT owner => amount of NFT
    mapping(uint256 => address) public ownerOf;     // tokenID => owner address
    mapping (uint256 => address) public allowance;  // TokenId => Authorised address

    /// modifiers
    /// ToDo: Place your modifiers here if you need any

    /// @notice Initialize the NFT collection
    /// @dev Throw if `_name`, '_symbol' or '_tokenURI' are empty, message: "_name, _symbol and _tokenURI are mandatory parameters".
    ///  Throw if `_symbol` is not 3 characters long, message: "Invalid symbol".
    /// @param _name The name of the NFT collection
    /// @param _symbol The symbol of the NFT collection
    /// @param _tokenURI The token URI of the NFT collection
    constructor(string memory _name, string memory _symbol, string memory _tokenURI) {
        if(bytes(_name).length == 0 || bytes(_symbol).length == 0 || bytes(_tokenURI).length == 0){
            revert("_name, _symbol and _tokenURI are mandatory parameters");
        }

        if(bytes(_symbol).length != 3){
            revert("Invalid symbol");
        }

        name = _name;
        symbol = _symbol;
        tokenURI = _tokenURI;
        owner = msg.sender;
    }

    /// @notice Mint a new NFT from the collection and assign the ownership to '_to' address parameter.
    /// Each mint operation must have a cost of 0.01 eth
    /// @dev Throw if `_to` is the zero address, message: "Invalid address".
    /// @dev Throw if the sender does not pay the minting price, with the message: "Mint has a cost of 0.01 eth"
    /// When mint is complete, this function checks if `_to` is a smart contract (code size > 0), if so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`, message: "Invalid contract".
    /// @param _to The address of new owner
    function safeMint(address _to) external payable{
        if (_to == address(0)) {
            revert("Invalid address");
        }

        if(msg.value < 1 * (10 ** uint256(16))){
            revert("Mint has a cost of 0.01 eth");
        }

        currentTokenID++;
        totalSupply++;
        ownerOf[currentTokenID] = _to;
        balanceOf[_to]++;

        if(_isSmartContractAddress(_to)){
            bytes4 retval = IERC721TokenReceiver(_to).onERC721Received(msg.sender, address(0), 1, "");
            if (retval != bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))) {
                revert("Invalid contract");
            }
        }      
    }

    /// @notice Transfers the ownership of an NFT from address '_from' to address '_to'
    /// @dev When transfer is complete, this function checks if `_to` is a smart contract (code size > 0), if so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`, message: "Invalid contract".
    /// @dev Throw if `_tokenId` is not a valid NFT identifier with "Invalid tokenId".
    /// @dev Throw if `_to` is the zero address with "Invalid address".
    /// @dev Throw if `_from` is not the current owner with message "Not the owner".    
    /// @dev Throw unless `msg.sender` is the current owner or an authorized address for the NFT, with message "Not authorized".
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external {
        if (_tokenId < 1 || _tokenId > currentTokenID){
            revert("Invalid tokenId");
        }

        if (_to == address(0)) {
            revert("Invalid address");
        }

        if(ownerOf[_tokenId] != _from){
            revert("Not the owner");
        }

        if(!(ownerOf[_tokenId] == msg.sender || allowance[_tokenId] == msg.sender)){
            revert("Not authorized");
        }

        balanceOf[_from]--;
        balanceOf[_to]++;
        ownerOf[_tokenId] = _to;
        allowance[_tokenId] = address(0);
        
        if(_isSmartContractAddress(_to)){
            bytes4 retval = IERC721TokenReceiver(_to).onERC721Received(msg.sender, address(0), 1, "");
            if (retval != bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))) {
                    revert("Invalid contract");
            }
        }  
    }

    /// @notice Change or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    /// @dev Throw if `_tokenId` is not a valid NFT identifier with "Invalid tokenId".
    /// @dev Throw unless `msg.sender` is the current NFT owner or an authorized address of the NFT, with message "Not authorized".
    /// @param _approved The new administrator of the NFT
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external {
        if (_tokenId < 1 || _tokenId > currentTokenID){
            revert("Invalid tokenId");
        }

        if(!(ownerOf[_tokenId] == msg.sender || allowance[_tokenId] == msg.sender)){
            revert("Not authorized");
        }

        allowance[_tokenId] = _approved;
    }

    /// @notice Withdrawal fees collected from the contract and sends it to the address _to
    /// Throw if sender is not the owner of the protocole, with message "Not authorized"
    /// Throw if `_to` is the zero address with message "Invalid destination address"
    /// Throw if contract balance is less than 0.02 eth, with message "Insufficient balance"
    /// @param _to Withdrawal Destination
    function withdrawFees(address _to) external {
        if(msg.sender != owner){
            revert("Not authorized");
        }

        if(_to == address(0)){
            revert("Invalid destination address");
        }

        if(address(this).balance < 2 * (10 ** uint256(16))){
            revert("Insufficient balance");
        }

        payable(_to).transfer(address(this).balance);
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