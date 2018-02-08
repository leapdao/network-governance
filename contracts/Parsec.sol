pragma solidity ^0.4.11;

import "./DelegateProxy.sol";
import "./Delegatable.sol";


/**
 * Based of the zeppelin token contract.
 */
contract Parsec is DelegateProxy, Delegatable {

  mapping(address => uint256) balances;
  uint256 totalSupply_ = 0;

  // fallback function
  function () public {
    delegatedFwd(delegation, msg.data);
  }
}
