pragma solidity ^0.4.11;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import "./ERC20.sol";
import "./ERC223ReceivingContract.sol";
import "./Pausable.sol";

contract Controller is ERC20, Pausable {
  using SafeMath for uint;

  address public parsecAddr;
  uint256 internal total_supply;
  mapping(address => uint256) internal balances;
  mapping (address => mapping (address => uint)) internal allowed;

  function Controller(address _parsecAddr) public
  {
    parsecAddr = _parsecAddr;
  }

  // ############################################
  // ########### PARSEC FUNCTIONS  ##############
  // ############################################

  function name() public constant returns (string) {
    return "ParSeC token";
  }

  function symbol() public constant returns (string) {
    return "PSC";
  }

  function decimals() public constant returns (uint256) {
    return 12;
  }

  function totalSupply() public constant returns (uint256) {
    return total_supply;
  }

  function balanceOf(address _owner) public constant returns (uint256) {
    return balances[_owner];
  }

  function allowance(address _owner, address _spender) public constant returns (uint256) {
    return allowed[_owner][_spender];
  }
}
