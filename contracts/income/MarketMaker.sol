pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./LatestERC721.sol";

contract MarketMaker {
  using SafeMath for uint256;
  mapping(address => uint256) claims;
  
  LatestERC721 nft;
  ERC20 token;
  ERC20 dai;
  address council;
  uint256 rate;
  uint256 base;
  uint256 constant min = 20000000000;
  
  constructor(ERC20 _token, ERC20 _dai, LatestERC721 _nft, address _council, uint256 _base) public {
    token = _token;
    dai = _dai;
    nft = _nft;
    council = _council;
    base = _base;
  }

  function sqrt(uint x) internal pure returns (uint y) {
    uint z = x.add(1).div(2);
    y = x;
    while (z < y) {
      y = z;
      z = x.div(z).add(z).div(2);
    }
  }

  function getAmount(uint256 _nftId, uint256 _value, address _owner) internal view returns (uint256) {
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
    if (createdAt < claims[_owner].add(3 days)) {
      return 0;
    }
    if (_value < base || _value > base.mul(16)) {
      return 0;
    }
    return sqrt(_value.mul(min).mul(min).div(base));
  }

  function balanceOf(address _owner) public view returns (uint256) {
    // check latest nft of owner
    uint256 nftId = nft.latestToken(_owner);
    return getAmount(nftId, base, _owner);
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    uint256 nftId = nft.latestToken(msg.sender);
    uint256 amount = getAmount(nftId, _value, msg.sender);
    require(amount > 0);
    // record claim
    claims[msg.sender] = now;
    // claim tokens
    token.transferFrom(msg.sender, council, _value);
    // pay dai based on amount of tacos
    dai.transferFrom(council, _to, amount);
    return true;
  }

}