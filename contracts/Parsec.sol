pragma solidity ^0.4.18;

import "./DelegateProxy.sol";
import "./Delegatable.sol";


/**
 * Based of the zeppelin token contract.
 */
contract Parsec is Delegatable, DelegateProxy {

  // fallback function
  function () public {
    delegatedFwd(delegation, msg.data);
  }
}
