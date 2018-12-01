pragma solidity ^0.4.24;

import "@thetta/core/contracts/tokens/PreserveBalancesOnTransferToken.sol";
import "./IBridgeContract.sol";


/**
 * @title ProposalsContract 
 * @dev This is the implementation of Proposals contract.
 * See https://github.com/leapdao/leap-contracts/blob/master/contracts/LeapBridge.sol
 */
contract ProposalsContract {
	IBridgeContract public bridge;
	address public multisigAddress;
	PreserveBalancesOnTransferToken public token;

	uint public QUORUM_PERCENT = 80;
	uint public CONSENSUS_PERCENT = 80;

	event VotingStarted(string _type, uint _param, uint _totalSupplyAtEvent, uint _eventId, address _byWhom);
	event VotingFinished();

	enum VotingType {
		SetExitStake,
		SetEpochLength
	}

	struct Voting {
		uint startedAt;
		VotingType votingType;
		uint param;
		uint eventId;
		uint pro;
		uint versus;
		uint totalSupplyAtEvent;
		mapping(address=>bool) voted;
	}

	Voting[] votings;

	modifier onlyMultisigAddress() {
		require(msg.sender==multisigAddress);
		_;
	}

	/**
	 * @notice _bridge SHOULD CALL transferOwnership() to THIS contract!
	 * @param _bridge – address of the bridge contract (that we will control)
	 * @param _token – address of the main DAO token
	 * @param _multisigAddress – address of the mulitisig contract (that controls us)
	 */
	constructor(IBridgeContract _bridge, PreserveBalancesOnTransferToken _token, address _multisigAddress) public {
		multisigAddress = _multisigAddress;
		bridge = _bridge;
		token = _token;
	}

	/**
	 * @dev Propose the 'exitStake' parameter change
	 * @notice This function creates voting
	 * @param _exitStake – value of exitStake param
	 */
	function setExitStake(uint256 _exitStake) public onlyMultisigAddress {
		Voting memory v;
		v.startedAt = now;
		v.votingType = VotingType.SetExitStake;
		v.param = _exitStake;
		v.eventId = token.startNewEvent();
		v.pro = 0;
		v.versus = 0;
		v.totalSupplyAtEvent = token.totalSupply();
		votings.push(v);
	
		emit VotingStarted("setExitStake", _exitStake, v.totalSupplyAtEvent, v.eventId, msg.sender);
	}

	/**
	 * @dev Propose the 'epochLength' parameter change
	 * @notice This function creates voting
	 * @param _epochLength – value of epochLength param
	 */
	function setEpochLength(uint _epochLength) public onlyMultisigAddress {
		Voting memory v;
		v.startedAt = now;
		v.votingType = VotingType.SetEpochLength;
		v.param = _epochLength;
		v.eventId = token.startNewEvent();
		v.pro = 0;
		v.versus = 0;
		v.totalSupplyAtEvent = token.totalSupply();
		votings.push(v);
		
		emit VotingStarted("setEpochLength", _epochLength, v.totalSupplyAtEvent, v.eventId, msg.sender);
	}

	/**
	 * @dev Get ALL voting count 
	 * @notice This function can be called by anyone
	 * @return Voting count
	 */
	function getVotingsCount()public view returns(uint){
		return votings.length;
	}

	/**
	* @dev Get voting data
	 * @notice This function can be called by anyone
	 * @param _votingIndex – voting number
	 * @return votingType – what is this voting for
	 * @return paramValue – what is param amount
	 * @return versus – sum of voters token amount, that voted no
	 * @return isFinished – is Quorum reached
	 * @return isResultYes – is voted yes >= 80%
	 */
	function getVotingStats(uint _votingIndex) public view returns(VotingType votingType, uint paramValue, uint pro, uint versus, bool isFinished, bool isResultYes) {
		require(_votingIndex<votings.length);
		votingType = votings[_votingIndex].votingType;
		paramValue = votings[_votingIndex].param;		
		pro = votings[_votingIndex].pro;
		versus = votings[_votingIndex].versus;
		isFinished = _isVotingFinished(_votingIndex);
		isResultYes = _isVotingResultYes(_votingIndex);
	}

	/**
	 * @dev Is selected voting finished?
	 * @param _votingIndex – voting number
	 * @return is quorum reched or not
	 */
	function _isVotingFinished(uint _votingIndex) internal returns(bool isFin) {
		require(_votingIndex<votings.length);
		if((now - v[_votingIndex].startedAt) > 1000*3600*24*14) {
			return true;
		}

		uint total = votings[_votingIndex].totalSupplyAtEvent;
		uint votesSum = votings[_votingIndex].pro + votings[_votingIndex].versus;
		isFin = (votesSum*100 >= total*QUORUM_PERCENT);
	}

	/**
	 * @dev Is selected voting result is YES? 
	 * @notice Not checking whether it is finished!
	 * @param _votingIndex – voting number
	 * @return is current result yes or not
	 */
	function _isVotingResultYes(uint _votingIndex) internal view returns(bool isYes) {
		require(_votingIndex<votings.length);
		if(votings[_votingIndex].versus==votings[_votingIndex].pro) {
			isYes = false;
		} else {
			isYes = (CONSENSUS_PERCENT*votings[_votingIndex].versus <= ((100-CONSENSUS_PERCENT)*votings[_votingIndex].pro));
		}
	}
	
	/**
	 * @dev Vote YES or NO
	 * @param _votingIndex – voting number
	 * @param _isYes – voters opinion
	 */
	function vote(uint _votingIndex, bool _isYes) public {
		require(_votingIndex<votings.length);
		require(!_isVotingFinished(_votingIndex));
		require(0!=token.getBalanceAtEventStart(votings[_votingIndex].eventId, msg.sender));
		require(!votings[_votingIndex].voted[msg.sender]);

		votings[_votingIndex].voted[msg.sender] = true;

		// 1 - recalculate stats
		if(_isYes){
			votings[_votingIndex].pro += token.getBalanceAtEventStart(votings[_votingIndex].eventId, msg.sender);
		}else{
			votings[_votingIndex].versus += token.getBalanceAtEventStart(votings[_votingIndex].eventId, msg.sender);
		}
		
		// 2 - if voting is finished (last caller) AND the result is YES -> call the target method 
		if(_isVotingFinished(_votingIndex) && _isVotingResultYes(_votingIndex)){
			emit VotingFinished();
 
			if(votings[_votingIndex].votingType==VotingType.SetExitStake){
				bridge.setExitStake(votings[_votingIndex].param);
			}else if(votings[_votingIndex].votingType==VotingType.SetEpochLength) {
				bridge.setEpochLength(votings[_votingIndex].param);		
			}

			token.finishEvent(votings[_votingIndex].eventId);
		}
	}
}
