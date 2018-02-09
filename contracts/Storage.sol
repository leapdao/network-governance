pragma solidity ^0.4.11;


contract Storage {

  mapping(bytes32 => address) public crate;

  event KeyHolderTransferred(address indexed previousHolder, address indexed newHolder);

  modifier onlyAddress(bytes32 key) {
    require(msg.sender == crate[key]);
    _;
  }

  function Storage () {
    crate['owner'] = msg.sender;
  }

  function setKeyHolder(bytes32 key, address _newHolder) onlyAddress('owner') {
    crate[key] = _newHolder;
  }

}
