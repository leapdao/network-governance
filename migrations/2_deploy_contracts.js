const Token = artifacts.require('./Token.sol');
const Controller = artifacts.require('./Controller.sol');

module.exports = async function(deployer) {
  // deploy proxy
  await deployer.deploy(Token);
  const tokenProxy = await Token.deployed();
  // deploy controller
  await deployer.deploy(Controller);
  const controller = await Controller.deployed();
  // create binding of proxy with controller interface
  let token = Controller.at(tokenProxy.address);
  // use binding
  await token.initialize(controller.address, 400000000);
  // check result
  let cap = await token.cap();
};
