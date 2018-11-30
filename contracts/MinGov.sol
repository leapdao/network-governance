
/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License, version 2,
 * found in the LICENSE file in the root directory of this source tree.
 */

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MinGov is Ownable {
  
  uint256 proposalTime;
  uint256 public first;
  uint256 public size;
  
  struct Proposal {
    address subject;
    uint32 created;
    bool canceled;
    bytes msgData;
  }
  
  mapping(uint256 => Proposal) public proposals;
  
  event NewProposal(uint256 indexed proposalId, address indexed subject, bytes msgData);
  event Execution(uint256 indexed proposalId, address indexed subject, bytes msgData);
  
  constructor(uint256 _proposalTime) public {
    proposalTime = _proposalTime;
    first = 1;
    size = 0;
  }

  function propose(address _subject, bytes _msgData) onlyOwner() public {
    require(size < 5);
    proposals[first + size] = Proposal(_subject, uint32(now), false, _msgData);
    emit NewProposal(first + size, _subject, _msgData);
    size++;
  }
  
  function cancel(uint256 _proposalId) onlyOwner() public {
    Proposal storage prop = proposals[_proposalId];
    require(prop.created > 0);
    require(prop.canceled == false);
    prop .canceled = true;
  }
  
  function finalize() public {
    for (uint256 i = first; i < first + size; i++) {
      Proposal memory prop = proposals[i];
      if (prop.created + proposalTime <= now) {
        if (!prop.canceled && prop.subject.call(prop.msgData)) {
         emit Execution(i, prop.subject, prop.msgData);
        }
        delete proposals[i];
        first++;
        size--;
      }
    }
  }
}