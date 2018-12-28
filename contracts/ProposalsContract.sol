pragma solidity ^0.4.24;

import "@thetta/core/contracts/tokens/PreserveBalancesOnTransferToken.sol";


/**
 * @title ProposalsContract 
 * @dev This is the implementation of Proposals contract.
 * See https://github.com/leapdao/leap-contracts/blob/master/contracts/LeapBridge.sol
 */
contract ProposalsContract {
	address public multisigAddress;
	PreserveBalancesOnTransferToken public token;

	uint public VETO_PERCENT = 30;
	uint daysToVote = 14;

	bool public stopped;

	event ProposalStarted(address _target, bytes _data, uint _totalSupplyAtEvent, uint _eventId, address _byWhom);
	event Execution(uint256 proposalId, address subject, bytes msgData);
	event ProposalFinished(bool _isYes);
	event EmergencyStop();
	event ContinueAfterEmergencyStop();

	struct Proposal {
		uint startedAt;
		address target;
		bytes data;
		uint eventId;
		uint vetoScore;
		uint totalSupplyAtEvent;
		mapping(address=>bool) voted;
		bool isFinalized;
	}

	Proposal[] proposals;

	modifier onlyMultisigAddress() {
		require(msg.sender==multisigAddress, "only multisigAddress");
		_;
	}

	modifier ifNotStopped() {
		require(!stopped);
		_;		
	}

	/**
	 * @notice _bridge SHOULD CALL transferOwnership() to THIS contract!
	 * @param _token – address of the main DAO token
	 * @param _multisigAddress – address of the mulitisig contract (that controls us)
	 */
	constructor(PreserveBalancesOnTransferToken _token, address _multisigAddress) public {
		multisigAddress = _multisigAddress;
		token = _token;
	}

	/**
	 * @dev Propose to change _paramType value to _param
	 * @notice This function creates proposal
	 * @param _target – target of call
	 * @param _data – call data
	 */
	function propose(address _target, bytes _data) public onlyMultisigAddress ifNotStopped {
		Proposal memory p;
		p.startedAt = block.timestamp;
		p.target = _target;
		p.data = _data;
		p.eventId = token.startNewEvent();
		p.vetoScore = 0;
		p.totalSupplyAtEvent = token.totalSupply();
		proposals.push(p);	
		emit ProposalStarted(_target, _data, p.totalSupplyAtEvent, p.eventId, msg.sender);	
	}

	/**
	 * @dev become immutable in a case of emergency situation
	 * @notice This function can be called only by MultisigAddress
	 */
	function emergencyStop() public onlyMultisigAddress {
		emit EmergencyStop();
		stopped = true;
	}

	/**
	 * @dev stop being immutable after emergency situation ends
	 * @notice This function can be called only by MultisigAddress
	 */
	function continueAfterEmergencyStop() public onlyMultisigAddress {
		emit ContinueAfterEmergencyStop();
		stopped = false;
	}

	/**
	 * @dev Get ALL proposal count 
	 * @notice This function can be called by anyone
	 * @return Proposal count
	 */
	function getProposalsCount() public view returns(uint) {
		return proposals.length;
	}

	/**
	* @dev Get proposal data
	 * @notice This function can be called by anyone
	 * @param _proposalIndex – proposal number
	 * @return target – address of a contract with the function, that will be called if proposal will be accepted
	 * @return data – data of the function, that will be called if proposal will be accepted
	 * @return paramValue – what is param amount
	 * @return pro – sum of voters token amount, that voted yes
	 * @return vetoScore – sum of voters token amount, that voted no
	 * @return isFinished – is Quorum reached
	 * @return isVetoed – is veto percent > 30
	 */
	function getProposalStats(uint _proposalIndex) public view 
		returns(address target, 
			bytes data, 
			bytes32 paramValue, 
			uint pro, 
			uint vetoScore, 
			bool isFinished, 
			bool isVetoed) 
	{
		require(_proposalIndex < proposals.length, "proposal should exist");
		
		target = proposals[_proposalIndex].target;
		data = proposals[_proposalIndex].data;		
		vetoScore = proposals[_proposalIndex].vetoScore;
		isFinished = _isProposalFinished(_proposalIndex);
		isVetoed = _isVetoed(_proposalIndex);
	}

	/**
	 * @dev Is selected proposal finished?
	 * @param _proposalIndex – proposal number
	 * @return is proposal finished or not
	 */
	function _isProposalFinished(uint _proposalIndex) internal view returns(bool isIt) {
		require(_proposalIndex < proposals.length, "proposal should exist");
		
		if (((block.timestamp) >= (proposals[_proposalIndex].startedAt + daysToVote * 1 days)) || 
			(_isVetoed(_proposalIndex))) {
			isIt = true;
		}
	}

	/**
	 * @dev Is selected proposal vetoed?
	 * @param _proposalIndex – proposal number
	 * @return is proposal vetoed or not
	 */	
	function _isVetoed(uint _proposalIndex) internal view returns(bool isIt) {
		if((proposals[_proposalIndex].vetoScore*100) >= (proposals[_proposalIndex].totalSupplyAtEvent*VETO_PERCENT)) {
			isIt = true;
		}
	}

	function finalize(uint _proposalIndex) public ifNotStopped {
		require(!proposals[_proposalIndex].isFinalized, "proposal should not be finalized");
		require(_isProposalFinished(_proposalIndex), "proposal should be finished");

		proposals[_proposalIndex].isFinalized = true;
		if(!_isVetoed(_proposalIndex)) {
			bool rv = proposals[_proposalIndex].target.call(proposals[_proposalIndex].data);
			if (rv) {
				emit ProposalFinished(true);
				emit Execution(_proposalIndex, proposals[_proposalIndex].target, proposals[_proposalIndex].data);
			} else {
				emit ProposalFinished(false);
			}			
		}
	}

	/**
	 * @dev veto proposal with index _proposalIndex
	 * @param _proposalIndex – proposal number
	 */
	function veto(uint _proposalIndex) public ifNotStopped {
		require(_proposalIndex < proposals.length, "proposal should exist");
		require(0 != token.getBalanceAtEventStart(proposals[_proposalIndex].eventId, msg.sender), 
			"voter that refused should have tokens");
		require(!proposals[_proposalIndex].voted[msg.sender], "voter should not vote twice");

		proposals[_proposalIndex].voted[msg.sender] = true;
		proposals[_proposalIndex].vetoScore += token.getBalanceAtEventStart(proposals[_proposalIndex].eventId, msg.sender);
		
		if(_isProposalFinished(_proposalIndex)) {
			finalize(_proposalIndex);
		}
	}
}
