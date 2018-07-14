pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract BasicIncomeFaucet {

    mapping(address => uint256) claims;
    
    ERC721 nft;
    ERC20 token;
    address council;
    uint256 valuePerTaco;
    
    constructor(ERC20 _token, ERC721 _nft, address _council, uint256 _valuePerTaco) public {
        token = _token;
        nft = _nft;
        council = _council;
        valuePerTaco = _valuePerTaco;
    }

    function claim(uint256 _nftId) public {
      // check owner of nft is sender
      require(nft.ownerOf(_nftId) == msg.sender);
      // read date from nft
      uint256 createdAt = uint32(_nftId);
      // check date is at least 3 days higher than last claim
      require(createdAt > claims[msg.sender] + 3 days);
      // check amount of tacos
      uint256 tacoCount = uint32(_nftId >> 32);
      // check amount is higher than 0 and lower than 9
      require(tacoCount >= 4);
      tacoCount = (tacoCount > 8) ? 8 : tacoCount;
      // record claim
      claims[msg.sender] = now;
      // pay out PSC based on amount of tacos
      token.transferFrom(council, msg.sender, valuePerTaco * tacoCount);
    }

}