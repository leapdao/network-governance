pragma solidity ^0.4.11;

import "./DelegateProxy.sol";

/**
 * Based of the zeppelin token contract.
 */
contract Parsec is DelegateProxy {

  uint256 internal total_supply;
  mapping(address => uint256) internal balances;
  mapping (address => mapping (address => uint)) internal allowed;

  // fallback function
  function () public payable {
    delegatedFwd(owner, msg.data);
  }
}
