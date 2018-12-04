
/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License, version 2,
 * found in the LICENSE file in the root directory of this source tree.
 */

pragma solidity 0.4.24;

import "./Initializable.sol";

contract Bridge is Initializable {
  address public operator;

  function setOperator(address _operator) public ifAdmin {
    operator = _operator;
  }

  function admin() public view returns (address) {
  	return _admin();
  }
}
