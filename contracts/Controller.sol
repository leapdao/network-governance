pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC827/ERC827Token.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract Controller is ERC827Token, MintableToken {
  address public thisAddr; // matches delegation slot in proxy
  uint256 public cap;
  string public constant name = "Parsec Labs"; // solium-disable-line uppercase
  string public constant symbol = "PSC"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase
  

  function initialize(address _controller, uint256 _cap) onlyOwner public {
    require(cap == 0);
    require(thisAddr == _controller);
    cap = _cap;
    totalSupply_ = 0;
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
