pragma solidity ^0.4.11;

import "zeppelin-solidity/contracts/token/ERC827/ERC827Token.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "./Initializable.sol";


contract Controller is ERC827Token, MintableToken, Initializable {
  string public constant name = "SimpleToken"; // solium-disable-line uppercase
  string public constant symbol = "SIM"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  uint256 public cap;

  function setCap(uint256 _cap) public {
    require(cap == 0);
    cap = _cap;
    totalSupply_ = 0;
    balances[msg.sender] = 0;
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
