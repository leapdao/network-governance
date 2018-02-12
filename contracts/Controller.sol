pragma solidity ^0.4.11;

import "./CappedToken.sol";


contract Controller is CappedToken {

  string public constant name = "ParSeC token";
  string public constant symbol = "PSC";
  uint8 public constant decimals = 12;

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
