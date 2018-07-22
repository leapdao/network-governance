pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./income/LatestERC721.sol";

contract VestingLock is Ownable, ERC20Basic {
  using SafeMath for uint256;
  
  uint256 receivedIncomes;
  // TODO: think about "holidays" for vesting
  uint256 vestingCliff;   // 44 basic incomes 
  uint256 vestingPeriod; // 176 basic incomes (in 4 years)
  mapping(uint256 => bool) claims;
  DetailedERC20 token;
  LatestERC721 nft;
  
  constructor(DetailedERC20 _token, LatestERC721 _nft, uint256 _vestingCliff, uint256 _vestingPeriod, address _beneficiary) public {
    token = _token;
    receivedIncomes = 0;
    vestingCliff = _vestingCliff;
    owner = _beneficiary;
    vestingPeriod = _vestingPeriod;
    nft = _nft;
    claims[0] = true;
  }

  function _amountVested(uint256 _nftId) internal view returns (uint256) {
    uint256 lookaheadIncomes = receivedIncomes;
    if (claims[_nftId] == false) {
      lookaheadIncomes++;
    }
    if (lookaheadIncomes >= vestingCliff) {
      uint256 fraction = (vestingPeriod <= lookaheadIncomes) ? 1 : vestingPeriod.sub(lookaheadIncomes);
      return totalSupply().div(fraction);
    }
  }

  function _tokensRemaining() internal view returns (uint256) {
    return token.balanceOf(this);
  }


  function totalSupply() public view returns (uint256) {
    return _tokensRemaining();
  }

  function balanceOf(address) public view returns (uint256) {
    uint256 nftId = nft.latestToken(owner);
    return _amountVested(nftId);
  }

  function decimals() public view returns (uint8) {
    return token.decimals();    
  }

  function name() public view returns (string) {
    return string(abi.encodePacked(token.name(), " Lock and Vesting"));
  }

  function symbol() public view returns (string) {
    return token.symbol();
  }

  function transfer(address, uint256 _nftId) onlyOwner public returns (bool) {
    if (_nftId == 0) {
      _nftId = nft.latestToken(owner);
    }
    require(claims[_nftId] == false);
    // verify that nft has been issued to owner address
    uint256 time = uint64(_nftId >> 192);
    uint256 tacoAmount = uint32(_nftId);
    uint256 expectedNftId = time << 192 | uint192(uint160(keccak256(abi.encodePacked(owner, tacoAmount, time)))) << 32 | tacoAmount;
    require(expectedNftId == _nftId);
    // remember nft and increase count
    claims[_nftId] = true;
    receivedIncomes++;
    // if we passed cliff, start paying
    if (receivedIncomes >= vestingCliff) {
      token.transfer(owner, _amountVested(_nftId));
    }
  }

}