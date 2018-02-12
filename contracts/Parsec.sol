pragma solidity ^0.4.11;


import "./Storage.sol";
import "./DelegateProxy.sol";

/**
 * Based of the zeppelin token contract.
 */
contract Parsec is Storage, DelegateProxy {

  // fallback function
  function () public payable {
    delegatedFwd(addresses['controller'], msg.data);
  }
}
