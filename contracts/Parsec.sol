pragma solidity ^0.4.11;

import "./DelegateProxy.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * Based of the zeppelin token contract.
 */
contract Parsec is DelegateProxy, Ownable {

  // fallback function
  function () public {
    delegatedFwd(owner, msg.data);
  }
}
