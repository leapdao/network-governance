pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/access/Whitelist.sol";
import "./LatestERC721.sol";

/**
 * @title TacoIncomeToken
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract TacoIncomeToken is ERC721Token, Whitelist, LatestERC721 {

  constructor() ERC721Token('TacoIncomeToken', 'TIT') public {
    addAddressToWhitelist(msg.sender);
  }

  function latestToken(address _from) public view returns (uint256) {
    if (ownedTokens[_from].length == 0) return 0;
    uint256 lastTokenIndex = ownedTokens[_from].length.sub(1);
    return ownedTokens[_from][lastTokenIndex];
  }

  function mint(address _to, uint256 _tacoAmount) public onlyIfWhitelisted(msg.sender) {
    require(_tacoAmount < 2^32);
    uint256 nftId = uint160(now << 128 | uint128(uint96(keccak256(abi.encodePacked(_to, _tacoAmount, now)))) << 32 | _tacoAmount);
    super._mint(_to, nftId);
  }

  function burn(uint256 _tokenId) public onlyIfWhitelisted(msg.sender) {
    super._burn(ownerOf(_tokenId), _tokenId);
  }
}