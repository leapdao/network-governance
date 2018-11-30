
/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License, version 2,
 * found in the LICENSE file in the root directory of this source tree.
 */

pragma solidity 0.4.24;


contract LeapBridge {
  mapping (bytes32 => address) upgradeStore;
  uint256 public exitStake;
  uint256 public epochLength;

  function setExitStake(uint256 _exitStake) public onlyOwner {
    exitStake = _exitStake;
  }

  function setEpochLength(uint256 _epochLength) public onlyOwner {
    epochLength = _epochLength;
  }


  bytes32 constant ownerKey = keccak256("some random key for owner");

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

  function transferOwnership(address) public onlyOwner {
  }

}
