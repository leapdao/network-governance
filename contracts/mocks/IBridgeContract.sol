pragma solidity ^0.4.24;


/**
 * @title IBridgeTestable 
 * Used only for test purposes to emulate bridge contract
 */
contract IBridgeContract {
	function setExitStake(uint _exitStake) public;

	function setEpochLength(uint _epochLength) public;
}
