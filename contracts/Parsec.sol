pragma solidity ^0.4.11;


import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import "./DelegateProxy.sol";

/**
 * Based of the zeppelin token contract.
 */
contract Parsec is Ownable, DelegateProxy {

  uint256 internal total_supply;
  mapping(address => uint256) internal balances;
  mapping (address => mapping (address => uint)) internal allowed;

  event Log(string eventName, string key, address indexed from, address indexed to, uint256 amount, uint256 value, bool status, bytes data);

  // onlyOWner function
  function eventCallback(string eventName, string key, address from, address to, uint256 amount, uint256 value, bool status, bytes data) public onlyOwner {
    Log(eventName, key, from, to, amount, value, status, data);
  }

  // fallback function
  function () public payable {
    delegatedFwd(owner, msg.data);
  }
}
