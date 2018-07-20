pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract LatestERC721 is ERC721 {
  function latestToken(address _owner) public view returns (uint256);
}
