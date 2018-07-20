pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./income/LatestERC721.sol";

contract VestingLock is Ownable {
    using SafeMath for uint256;
    
    uint256 receivedIncomes;
    // TODO: think about "holidays" for vesting
    uint256 vestingCliff;   // 44 basic incomes 
    uint256 vestingPeriod; // 176 basic incomes (in 4 years)
    address beneficiary;
    mapping(uint256 => bool) claims;
    ERC20 token;
    LatestERC721 nft;
    
    constructor(ERC20 _token, LatestERC721 _nft, uint256 _vestingCliff, uint256 _vestingPeriod, address _beneficiary) public {
        token = _token;
        receivedIncomes = 0;
        vestingCliff = _vestingCliff;
        owner = _beneficiary;
        beneficiary = _beneficiary;
        vestingPeriod = _vestingPeriod;
        nft = _nft;
        claims[0] = true;
    }

    function totalSupply() public view returns (uint256) {
        return token.balanceOf(this);
    }

    function balanceOf(address _caller) public view returns (uint256) {
        uint256 lookaheadIncomes = receivedIncomes;
        uint256 nftId = nft.latestToken(_caller);
        if (claims[nftId] == false) {
            lookaheadIncomes++;
        }
        if (lookaheadIncomes >= vestingCliff) {
            uint256 fraction = (vestingPeriod <= lookaheadIncomes) ? 1 : vestingPeriod.sub(lookaheadIncomes);
            return totalSupply().div(fraction);
        }
    }
    
    function transfer(address, uint256 _nftId) onlyOwner public returns (bool) {
        if (_nftId == 0) {
            _nftId = nft.latestToken(msg.sender);
        }
        require(claims[_nftId] == false);
        // verify that nft has been issued to beneficiary address
        uint256 time = uint64(_nftId >> 192);
        uint256 tacoAmount = uint32(_nftId);
        uint256 expectedNftId = time << 192 | uint192(uint160(keccak256(abi.encodePacked(beneficiary, tacoAmount, time)))) << 32 | tacoAmount;
        require(expectedNftId == _nftId);
        claims[_nftId] = true;
        receivedIncomes++;
        if (receivedIncomes >= vestingCliff) {
            token.transfer(msg.sender, balanceOf(msg.sender));
        }
    }

}