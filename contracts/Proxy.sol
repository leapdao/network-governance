pragma solidity ^0.4.24;

/**
 * @title Proxy
 * Basic proxy implementation to controller
 */
contract Proxy {
  bytes32 constant ownerKey = keccak256("some random key for owner");
  bytes32 constant logicKey = keccak256("some random key for logic");
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
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
      emit OwnershipTransferred(upgradeStore[ownerKey], address(0));
      upgradeStore[ownerKey] = address(0);
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
   * @dev Function to invoke all function that are implemented in controler
   */
  function () public {
    address logicAddr = upgradeStore[logicKey];

    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize)
      let result := delegatecall(gas, logicAddr, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }

}