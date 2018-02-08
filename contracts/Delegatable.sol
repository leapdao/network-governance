pragma solidity ^0.4.18;

/**
 * @title Delegatable
 * ownable contract extended by one more variable
 */
contract Delegatable {
  address empty1; // unknown slot
  address empty2; // unknown slot
  address empty3;  // unknown slot
  address public owner;  // matches owner slot in controller
  address public delegation; // matches thisAddr slot in controller

  event DelegationTransferred(address indexed previousDelegate, address indexed newDelegation);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

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

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}