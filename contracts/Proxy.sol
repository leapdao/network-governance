
/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License, version 2,
 * found in the LICENSE file in the root directory of this source tree.
 */

pragma solidity ^0.4.24;

/**
 * @title Proxy
 * Basic proxy implementation to controller
 */
contract Proxy {
  // keccak256("org.leapdao.proxy.ownerAddr");
  bytes32 constant ownerKey = 0xfe2c13e96b9e768f0a0d627bedc53ba66342556bfc6426d5cb693df598dcc3fb;
  // keccak256("org.leapdao.proxy.logicAddr");
  bytes32 constant logicKey = 0x3ea85b8efcc45787f89f7d3de80653ae6beddd6dbeed03a8736f1e9b93ffa5fb;
  mapping (bytes32 => address) upgradeStore;

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor () public {
      upgradeStore[ownerKey] = msg.sender;
      emit OwnershipTransferred(address(0), msg.sender);
  }

  /**
   * @dev Function to initialize storage of proxy
   * @param _newLogicAddr The address of the logic contract to load the code from
   */
  function initialize(address _newLogicAddr) public {
    require(upgradeStore[logicKey] == 0);
    require(_newLogicAddr != address(0));
    upgradeStore[logicKey] = _newLogicAddr;
    emit LogicTransferred(address(0), _newLogicAddr);
  }

  // LOGIC THINGS

  event LogicTransferred(address indexed previousLogicAddr, address indexed newLogicAddr);

  /**
   * @dev Allows owner to transfer logic of the contract to a _newLogicAddr.
   * @param _newLogicAddr The address to transfer delegation to.
   */
  function transferLogic(address _newLogicAddr) public onlyOwner {
    require(_newLogicAddr != address(0));
    emit LogicTransferred(upgradeStore[logicKey], _newLogicAddr);
    upgradeStore[logicKey] = _newLogicAddr;
  }

  /**
   * @return the address of the logic.
   */
  function logic() public view returns (address) {
      return upgradeStore[logicKey];
  }

  // OWNER THINGS

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @return the address of the owner.
   */
  function owner() public view returns (address) {
      return upgradeStore[ownerKey];
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
      require(isOwner());
      _;
  }

  /**
   * @return true if `msg.sender` is the owner of the contract.
   */
  function isOwner() public view returns (bool) {
      return msg.sender == upgradeStore[ownerKey];
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) public onlyOwner {
      _transferOwnership(_newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address _newOwner) internal {
      require(_newOwner != address(0));
      emit OwnershipTransferred(upgradeStore[ownerKey], _newOwner);
      upgradeStore[ownerKey] = _newOwner;
  }

  // CATCHALL

  /**
   * @dev Function to invoke all function that are implemented in logic
   */
  function () payable public {
    address logicAddr = upgradeStore[logicKey];

    assembly {
      // Copy msg.data. We take full control of memory in this inline assembly
      // block because it will not return to Solidity code. We overwrite the
      // Solidity scratch pad at memory position 0.
      calldatacopy(0, 0, calldatasize)

      // Call the implementation.
      // out and outsize are 0 because we don't know the size yet.
      let result := delegatecall(gas, logicAddr, 0, calldatasize, 0, 0)

      // Copy the returned data.
      returndatacopy(0, 0, returndatasize)

      switch result
      // delegatecall returns 0 on error.
      case 0 { revert(0, returndatasize) }
      default { return(0, returndatasize) }
    }
  }

}