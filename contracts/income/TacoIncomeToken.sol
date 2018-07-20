pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "openzeppelin-solidity/contracts/access/Whitelist.sol";
import "./LatestERC721.sol";

/**
 * @title TacoIncomeToken
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract TacoIncomeToken is ERC721Token, Whitelist, LatestERC721 {

  constructor() ERC721Token('ParsecIncomeToken', 'PIT') public {
    addAddressToWhitelist(msg.sender);
  }

  function latestToken(address _from) public view returns (uint256) {
    if (ownedTokens[_from].length == 0) return 0;
    uint256 lastTokenIndex = ownedTokens[_from].length.sub(1);
    return ownedTokens[_from][lastTokenIndex];
  }

  function mint(address _to, uint32 _tacoAmount) public onlyIfWhitelisted(msg.sender) {
    super._mint(_to, now << 192 | uint160(keccak256(abi.encodePacked(_to, _tacoAmount, now))) << 32 | _tacoAmount);
  }

  function burn(uint256 _tokenId) public onlyIfWhitelisted(msg.sender) {
    super._burn(ownerOf(_tokenId), _tokenId);
  }
}