pragma solidity ^0.4.11;


contract Storage {

  mapping(bytes32 => address) public addresses;
  mapping(bytes32 => uint256) public uints;
  mapping(bytes32 => bool) public bools;

  event KeyHolderTransferred(address indexed previousHolder, address indexed newHolder);

  modifier onlyAddress(bytes32 key) {
    require(msg.sender == addresses[key]);
    _;
  }

  function Storage () {
    addresses['owner'] = msg.sender;
  }

  function setKeyHolder(bytes32 key, address _newHolder) onlyAddress('owner') {
    addresses[key] = _newHolder;
  }

}
