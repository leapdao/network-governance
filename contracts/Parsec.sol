pragma solidity ^0.4.24;

import "./DelegateProxy.sol";
import "./Delegatable.sol";

/**
 * @title Parsec
 * Basic proxy implementation to controller
 */
contract Parsec is Delegatable, DelegateProxy {

  /**
   * @dev Function to invoke all function that are implemented in controler
   */
  function () public {
    delegatedFwd(delegation, msg.data);
  }

  /**
   * @dev Function to initialize storage of proxy
   * @param _controller The address of the controller to load the code from
   * @param _cap Max amount of tokens that should be mintable
   */
  function initialize(address _controller, uint256 _cap) public {
    require(owner == 0);
    owner = msg.sender;
    delegation = _controller;
    delegatedFwd(_controller, msg.data);
  }

}
