pragma solidity ^0.4.11;

import "./CappedToken.sol";


contract Controller is CappedToken {

  string public name = "ParSeC token";
  string public symbol = "PSC";
  uint8 public decimals = 12;

  function Controller(uint256 _cap) public
    CappedToken(_cap)
  {

  }

  function initialize(uint256 _cap) public {
    require(cap == 0);
    require(_cap > 0);
    cap = _cap;
    totalSupply_ = 0;
  }
}
