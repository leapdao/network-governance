pragma solidity ^0.4.11;

import "./MintableToken.sol";


contract Controller is MintableToken {

  string public name = "ParSeC token";
  string public symbol = "PSC";
  uint8 public decimals = 12;

}
