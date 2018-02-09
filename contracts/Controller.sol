pragma solidity ^0.4.11;

import "./MintableToken.sol";
import "./PausableToken.sol";


contract Controller is PausableToken {

  string public name = "ParSeC token";
  string public symbol = "PSC";
  uint8 public decimals = 12;

}
