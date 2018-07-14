pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract MarketMaker {
    mapping(address => uint256) claims;
    
    ERC721 nft;
    ERC20 token;
    ERC20 dai;
    address council;
    uint256 rate;
    uint256 base;
    uint256 constant min = 20000000000;
    
    constructor(ERC20 _token, ERC20 _dai, ERC721 _nft, address _council, uint256 _base) public {
        token = _token;
        dai = _dai;
        nft = _nft;
        council = _council;
        base = _base;
    }

    function sqrt(uint x) internal pure returns (uint y) {
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function claim(uint256 _nftId, uint256 _value) public {
      // check owner of nft is sender
      require(nft.ownerOf(_nftId) == msg.sender);
      // read date from nft
      uint256 createdAt = uint32(_nftId);
      // check date is at least 3 days higher than last claim
      require(createdAt > claims[msg.sender] + 3 days);
      // check amount is higher than 0 and lower than 9
      require(_value >= base);
      require(_value <= base * 16);
      uint256 amount = sqrt(_value / base) * min;
      // record claim
      claims[msg.sender] = now;
      // claim tokens
      token.transferFrom(msg.sender, council, _value);
      // pay dai based on amount of tacos
      dai.transferFrom(council, msg.sender, amount);
    }

}