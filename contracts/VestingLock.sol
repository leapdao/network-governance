pragma solidity ^0.4.19;

import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract VestingLock is Ownable {
    using SafeMath for uint256;
    
    uint256 receivedIncomes;
    uint256 vestingCliff;   // 44 basic incomes 
    uint256 vestingPeriod; // 176 basic incomes (in 4 years)
    address beneficiary;
    ERC20 token;
    
    constructor(ERC20 _token, uint256 _vestingCliff, uint256 _vestingPeriod, address _beneficiary) public {
        token = _token;
        receivedIncomes = 0;
        vestingCliff = _vestingCliff;
        beneficiary = _beneficiary;
        vestingPeriod = _vestingPeriod;
    }
    
    function recordBasicIncome() onlyOwner public {
        require(receivedIncomes < vestingPeriod-1);
        receivedIncomes++;
    }
    
  modifier onlyBeneficiary() {
    require(msg.sender == beneficiary);
    _;
  }
    
    function withdraw() onlyBeneficiary public {
        require(receivedIncomes >= vestingCliff);
        uint256 balance = token.balanceOf(this);
        token.transfer(msg.sender, balance.div(vestingPeriod.sub(receivedIncomes)));
    }

}