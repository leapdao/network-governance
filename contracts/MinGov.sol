pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract MinGov is Ownable {
    
    uint256 proposalTime;
    
    address public governed;
    uint256 public first;
    uint256 public size;
    
    struct Proposal {
        bytes msgData;
        uint256 created;
    }
    
    mapping(uint256 => Proposal) public proposals;
    
    event NewProposal(uint256 indexed proposalId, bytes msgData);
    event Execution(uint256 indexed proposalId, bytes msgData);
    
    constructor(address _governed, uint256 _proposalTime) public {
        governed = _governed;
        proposalTime = _proposalTime;
        first = 1;
        size = 0;
    }
    
    function propose(bytes _msgData) onlyOwner() public {
        require(size < 5);
        proposals[first + size] = Proposal(_msgData, now);
        emit NewProposal(first + size, _msgData);
        size++;
    }
    
    function finalize() public {
        for (uint256 i = first; i < first + size; i++) {
            if (proposals[i].created + proposalTime <= now) {
                if (governed.call(proposals[i].msgData)) {
                   emit Execution(i, proposals[i].msgData);
                }
                delete proposals[i];
                first++;
                size--;
            }
        }
    }
    
}