pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./LatestERC721.sol";


contract MarketMaker {
  using SafeMath for uint256;
  mapping(address => uint256) claims;
  
  LatestERC721 nft;
  ERC20 token;
  DetailedERC20 dai;
  address council;
  uint256 basePscValue;
  uint256 minDaiPayment;
  
  constructor(
    ERC20 _token, DetailedERC20 _dai, LatestERC721 _nft,
    address _council, uint256 _basePscValue, uint256 _minDaiPayment
  ) public {
    token = _token;
    dai = _dai;
    nft = _nft;
    council = _council;
    basePscValue = _basePscValue;
    minDaiPayment = _minDaiPayment;
  }

  function balanceOf(address _owner) public view returns (uint256) {
    // check latest nft of owner
    uint256 nftId = nft.latestToken(_owner);
    return getAmount(nftId, basePscValue, _owner);
  }

  function decimals() public view returns (uint8) {
    return dai.decimals();    
  }

  function name() public view returns (string) {
    return string(abi.encodePacked("PARSEC ", dai.name(), " Market Maker"));
  }

  function symbol() public view returns (string) {
    return dai.symbol();
  }

  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0), "Shouldn't send to 0x0");
    uint256 nftId = nft.latestToken(msg.sender);
    uint256 amount = getAmount(nftId, _value, msg.sender);
    require(amount > 0, "Nothing to transfer");
    // record claim
    // solium-disable-next-line security/no-block-members
    claims[msg.sender] = now;
    // claim tokens
    token.transferFrom(msg.sender, council, _value);
    // pay dai based on amount of tacos
    dai.transferFrom(council, _to, amount);
    return true;
  }

  function sqrt(uint x) internal pure returns (uint y) {
    uint z = x.add(1).div(2);
    y = x;
    while (z < y) {
      y = z;
      z = x.div(z).add(z).div(2);
    }
  }

  function getAmount(
    uint256 _nftId, uint256 _value, address _owner
  ) 
    internal view returns (uint256)
  {
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
    if (_value < basePscValue || _value > basePscValue.mul(16)) {
      return 0;
    }
    return sqrt(
      _value.mul(minDaiPayment).mul(minDaiPayment).div(basePscValue)
    );
  }

}