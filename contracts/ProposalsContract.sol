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

	event ProposalStarted(address _target, bytes _data, uint _totalSupplyAtEvent, uint _eventId, address _byWhom);
	event Execution(uint256 proposalId, address subject, bytes msgData);
	event ProposalFinished();

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
		require(msg.sender==multisigAddress);
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
	function propose(address _target, bytes _data) onlyMultisigAddress public {
		Proposal memory p;
		p.startedAt = now;
		p.target = _target;
		p.data = _data;
		p.eventId = token.startNewEvent();
		p.vetoScore = 0;
		p.totalSupplyAtEvent = token.totalSupply();
		proposals.push(p);	
		emit ProposalStarted(_target, _data, p.totalSupplyAtEvent, p.eventId, msg.sender);	
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
	 * @return paramType – what is this proposal for
	 * @return paramValue – what is param amount
	 * @return vetoScore – sum of voters token amount, that voted no
	 * @return isFinished – is Quorum reached
	 * @return isResultYes – is voted yes >= 80%
	 */
	function getProposalStats(uint _proposalIndex) public view returns(address target, bytes data, bytes32 paramValue, uint pro, uint vetoScore, bool isFinished, bool isVetoed) {
		require(_proposalIndex<proposals.length);
		
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
		require(_proposalIndex<proposals.length);
		
		if (((now) >= (proposals[_proposalIndex].startedAt + daysToVote * 1 days)) || 
			(_isVetoed(_proposalIndex))) {
			isIt = true;
		}
	}

	/**
	 * @dev Is selected proposal finished?
	 * @param _proposalIndex – proposal number
	 * @return is proposal vetoed or not
	 */	
	function _isVetoed(uint _proposalIndex) internal view returns(bool isIt) {
		if((proposals[_proposalIndex].vetoScore*100) >= (proposals[_proposalIndex].totalSupplyAtEvent*VETO_PERCENT)) {
			isIt = true;
		}
	}

	function finalize(uint _proposalIndex) public {
		require(!proposals[_proposalIndex].isFinalized);
		require(_isProposalFinished(_proposalIndex));

		proposals[_proposalIndex].isFinalized = true;
		if(!_isVetoed(_proposalIndex)) {
			emit ProposalFinished();
			bool rv = proposals[_proposalIndex].target.call(proposals[_proposalIndex].data);
			if (rv) {
				emit Execution(_proposalIndex, proposals[_proposalIndex].target, proposals[_proposalIndex].data);
			}			
		}
	}

	/**
	 * @dev veto proposal with index _proposalIndex
	 * @param _proposalIndex – proposal number
	 */
	function veto(uint _proposalIndex) public {
		require(_proposalIndex < proposals.length);
		require(0 != token.getBalanceAtEventStart(proposals[_proposalIndex].eventId, msg.sender));
		require(!proposals[_proposalIndex].voted[msg.sender]);

		proposals[_proposalIndex].voted[msg.sender] = true;

		// 1 - recalculate stats
		proposals[_proposalIndex].vetoScore += token.getBalanceAtEventStart(proposals[_proposalIndex].eventId, msg.sender);
		
		if(_isProposalFinished(_proposalIndex)) {
			finalize(_proposalIndex);
		}
	}
}
