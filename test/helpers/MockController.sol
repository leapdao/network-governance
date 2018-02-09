pragma solidity ^0.4.11;

import "../../contracts/Controller.sol";


contract MockController is Controller {

  string public name = "ParSeC token";
  string public symbol = "PSC";
  uint8 public decimals = 12;

  function checkAddress(bytes32 key) public view returns (address) {
    return crate[key];
  }

}
