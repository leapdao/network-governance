pragma solidity ^0.4.11;

contract Initializable {

  uint256 internal initializationBlock;

  function getBlockNumber() internal constant returns (uint256) {
    return block.number;
  }

  function getInitializationBlock() public constant returns (uint256) {
      return initializationBlock;
  }

  function initialize() public {
    initializationBlock = getBlockNumber();
  }
}
