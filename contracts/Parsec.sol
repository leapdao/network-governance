pragma solidity ^0.4.18;

import "./DelegateProxy.sol";
import "./Delegatable.sol";


/**
 * Proxy to token contract with permanent address.
 */
contract Parsec is Delegatable, DelegateProxy {

  address public controllerAddr;

  function setController(address _controllerAddr) public onlyOwner {
    controllerAddr = _controllerAddr;
  }

  // fallback function
  function () public {
    delegatedFwd(delegation, msg.data);
  }

  // same signature as in controller, executed only once
  function initialize(address _controller, uint256 _cap) public {
    require(owner == 0);
    owner = msg.sender;
    delegation = _controller;
    delegatedFwd(_controller, msg.data);
  }

}
