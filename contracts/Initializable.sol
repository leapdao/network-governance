pragma solidity ^0.4.11;

import "./Governable.sol";

contract Initializable is Governable {

  uint256 internal initializationBlock;

  function Initializable() {
    initializationBlock = getBlockNumber();
  }

  function getBlockNumber() internal constant returns (uint256) {
    return block.number;
  }

  function getInitializationBlock() public constant returns (uint256) {
      return initializationBlock;
  }

  function Initialize() public {
    require(initializationBlock == 0);
    admins.length = 1;
    admins[0] = msg.sender;
    initializationBlock = getBlockNumber();
  }
}
