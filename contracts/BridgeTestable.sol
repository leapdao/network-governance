pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IBridgeContract.sol";


/**
 * @title BridgeTestable 
 * @dev This is the implementation of IBridgeContract
 * Used only for test purposes to emulate bridge contract
 */
contract BridgeTestable is Ownable, IBridgeContract {
	uint public exitStake;
	uint public epochLength;

	/**
	 * @notice This function can be called only by owner
	 * @param _exitStake – value of exitStake param
	 */
	function setExitStake(uint _exitStake) public onlyOwner {
		exitStake = _exitStake;
	}

	/**
	 * @notice This function can be called only by owner
	 * @param _epochLength – value of epochLength param
	 */
	function setEpochLength(uint _epochLength) public onlyOwner {
		epochLength = _epochLength;
	}
}
