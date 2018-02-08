pragma solidity ^0.4.11;

import "./DelegateProxy.sol";
import "./Delegatable.sol";


/**
 * Based of the zeppelin token contract.
 */
contract Parsec is DelegateProxy, Delegatable {

  // fallback function
  function () public {
    delegatedFwd(delegation, msg.data);
  }
}
