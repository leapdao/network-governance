pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Delegatable
 */
contract Delegatable {
  address public owner;
  address public empty;
  address public delegation;

  function Delegatable() public {
    owner = msg.sender;
  }

  event DelegationTransferred(address indexed previousDelegate, address indexed newDelegation);

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
  /**
   * @dev Allows owner to transfer delegation of the contract to a newDelegation.
   * @param newDelegation The address to transfer delegation to.
   */
  function transferDelegation(address newDelegation) public onlyOwner {
    require(newDelegation != address(0));
    DelegationTransferred(delegation, newDelegation);
    delegation = newDelegation;
  }

}