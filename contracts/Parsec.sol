pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "./DelegateProxy.sol";

/**
 * Based of the zeppelin token contract.
 */
contract Parsec is Ownable, DelegateProxy {

  // fallback function
  function () public payable {
    delegatedFwd(owner, msg.data);
  }
}
