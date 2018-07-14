pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract LatestERC721 is ERC721 {
  function latestToken(address _owner) public view returns (uint256);
}

contract BasicIncomeFaucet {

    mapping(address => uint256) claims;
    
    LatestERC721 nft;
    ERC20 token;
    address council;
    uint256 valuePerTaco;
    
    constructor(ERC20 _token, LatestERC721 _nft, address _council, uint256 _valuePerTaco) public {
        token = _token;
        nft = _nft;
        council = _council;
        valuePerTaco = _valuePerTaco;
    }

    function getAmount(uint256 _nftId, address _owner) internal view returns (uint256) {
      if (_nftId == 0) {
        return 0;
      }
      // check owner of nft is sender
      if (nft.ownerOf(_nftId) != _owner) {
        return 0;
      }
      // read date from nft
      uint256 createdAt = _nftId >> 192;
      // check date is at least 3 days higher than last claim
      if (createdAt < claims[_owner] + 3 days) {
        return 0;
      }
      // check amount of tacos
      uint256 tacoCount = uint32(_nftId);
      // check amount is higher than 0 and lower than 9
      if (tacoCount < 4) {
        return 0;
      }
      tacoCount = (tacoCount > 8) ? 8 : tacoCount;
      return valuePerTaco * tacoCount;
    }

    function balanceOf(address _owner) public view returns (uint256) {
      // check latest nft of owner
      uint256 nftId = nft.latestToken(_owner);
      return getAmount(nftId, _owner);
    }

    function transfer(address _to, uint256) public returns (bool) {
      require(_to != address(0));
      uint256 nftId = nft.latestToken(msg.sender);
      uint256 amount = getAmount(nftId, msg.sender);
      require(amount > 0);
      // record claim
      claims[msg.sender] = now;
      // pay out PSC based on amount of tacos
      token.transferFrom(council, _to, amount);
      return true;
    }

}