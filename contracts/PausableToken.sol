pragma solidity ^0.4.18;

import "./Pausable.sol";
import "zeppelin-solidity/contracts/token/ERC827/ERC827Token.sol";


/**
 * @title Pausable token
 * @dev StandardToken modified with pausable transfers.
 **/
contract PausableToken is Pausable, ERC827Token {

  function transfer(address _to, uint256 _value) public whenNotPaused returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) public whenNotPaused returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  function approve(address _spender, uint256 _value) public whenNotPaused returns (bool) {
    return super.approve(_spender, _value);
  }

  function increaseApproval(address _spender, uint _addedValue) public whenNotPaused returns (bool success) {
    return super.increaseApproval(_spender, _addedValue);
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public whenNotPaused returns (bool success) {
    return super.decreaseApproval(_spender, _subtractedValue);
  }

  function transferData(address _to, uint256 _value, bytes _data) public whenNotPaused returns (bool) {
    return super.transfer(_to, _value, _data);
  }

  function transferFromData(address _from, address _to, uint256 _value, bytes _data) public whenNotPaused returns (bool) {
    return super.transferFrom(_from, _to, _value, _data);
  }

  function approveData(address _spender, uint256 _value, bytes _data) public whenNotPaused returns (bool) {
    return super.approve(_spender, _value, _data);
  }

  function increaseApprovalData(address _spender, uint _addedValue, bytes _data) public whenNotPaused returns (bool success) {
    return super.increaseApproval(_spender, _addedValue, _data);
  }

  function decreaseApprovalData(address _spender, uint _subtractedValue, bytes _data) public whenNotPaused returns (bool success) {
    return super.decreaseApproval(_spender, _subtractedValue, _data);
  }
}
