pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC827/ERC827Token.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract Controller is ERC827Token, MintableToken {
  address thisAddr; // matches delegation slot in proxy
  string public name;
  string public symbol;
  uint8 public decimals;
  uint256 public cap;

  function initialize(address _controller, uint256 _cap) onlyOwner public {
    require(cap == 0);
    cap = _cap;
  	name = "Parsec Labs";
  	symbol = "PSC";
  	decimals = 18;
    totalSupply_ = 1;
    balances[msg.sender] = 1;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
  	require(cap > 0);
    require(totalSupply_.add(_amount) <= cap);
    return super.mint(_to, _amount);
  }

}
